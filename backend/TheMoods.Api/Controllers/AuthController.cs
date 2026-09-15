using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TheMoods.Data.Contexts;
using TheMoods.Data.Models;
using System.Linq;

namespace TheMoods.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly TenantDbContext _context;

        public AuthController(TenantDbContext context)
        {
            _context = context;
        }

        // =====================================================================
        // CUSTOMER APIs — Business logic không thay đổi
        // =====================================================================

        // 1. Đăng ký khách hàng mới
        [HttpPost("customer/register")]
        public async Task<IActionResult> RegisterCustomer([FromBody] CustomerRegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(new { message = "Số điện thoại và Họ tên không được để trống!" });
            }

            var phone = dto.PhoneNumber.Trim();
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone && u.RoleId == 4);

            if (existingUser != null)
            {
                return BadRequest(new { message = "Số điện thoại này đã được đăng ký thành viên!" });
            }

            var customerId = Guid.NewGuid().ToString();
            var customer = new User
            {
                Id = customerId,
                RoleId = 4, // Customer
                PhoneNumber = phone,
                FullName = dto.FullName.Trim(),
                QrCode = "{\"id\":\"" + customerId + "\",\"phone\":\"" + phone + "\"}",
                IsDeleted = false
            };

            _context.Users.Add(customer);
            await _context.SaveChangesAsync();

            var locId = "govap-branch";
            if (!string.IsNullOrWhiteSpace(dto.LocationId))
            {
                var locExists = await _context.Locations.AnyAsync(l => l.Id == dto.LocationId);
                if (locExists)
                {
                    locId = dto.LocationId;
                }
            }

            var wallet = new CustomerPoint
            {
                Id = Guid.NewGuid().ToString(),
                UserId = customer.Id,
                LocationId = locId,
                TotalPoints = 0,
                UpdatedAt = DateTime.UtcNow
            };
            _context.CustomerPoints.Add(wallet);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký thành viên thành công!",
                user = new
                {
                    customer.Id,
                    customer.PhoneNumber,
                    customer.FullName,
                    customer.QrCode,
                    RoleId = customer.RoleId,
                    Points = 0
                }
            });
        }

        // 2. Đăng nhập khách hàng bằng SĐT
        [HttpPost("customer/login")]
        public async Task<IActionResult> LoginCustomer([FromBody] CustomerLoginDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await _context.Users
                .Include(u => u.CustomerPoints)
                .FirstOrDefaultAsync(u => u.PhoneNumber == phone && u.RoleId == 4);

            if (user == null)
            {
                return NotFound(new { message = "Số điện thoại chưa đăng ký thành viên. Vui lòng đăng ký mới!" });
            }

            var locId = "govap-branch";
            if (!string.IsNullOrWhiteSpace(dto.LocationId))
            {
                var locExists = await _context.Locations.AnyAsync(l => l.Id == dto.LocationId);
                if (locExists)
                {
                    locId = dto.LocationId;
                }
            }

            var wallet = await _context.CustomerPoints.FirstOrDefaultAsync(w => w.UserId == user.Id && w.LocationId == locId);
            int points = wallet?.TotalPoints ?? 0;
            bool hasPin = !string.IsNullOrWhiteSpace(user.PinHash);
            bool bioEnabled = !string.IsNullOrWhiteSpace(user.BiometricKey);

            return Ok(new
            {
                message = "Đăng nhập thành công!",
                user = new
                {
                    user.Id,
                    user.PhoneNumber,
                    user.FullName,
                    user.QrCode,
                    RoleId = user.RoleId,
                    Points = points,
                    hasPin,
                    bioEnabled,
                    biometricKey = user.BiometricKey
                }
            });
        }

        // 3. Đăng nhập Admin / Super Admin
        [HttpPost("admin/login")]
        public async Task<IActionResult> LoginAdmin([FromBody] AdminLoginDto dto)
        {
            var val = dto.Identifier.Trim().ToLower();

            User? user = null;
            if (val == "super" || val == "saas")
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.RoleId == 1);
            }
            else if (val == "admin")
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.RoleId == 2);
            }
            else
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == dto.Identifier || u.FullName.ToLower() == val);
            }

            if (user == null || (user.RoleId != 1 && user.RoleId != 2))
            {
                return BadRequest(new { message = "Tài khoản quản trị không tồn tại hoặc sai thông tin đăng nhập!" });
            }

            return Ok(new
            {
                message = "Đăng nhập quản trị thành công!",
                user = new
                {
                    user.Id,
                    user.PhoneNumber,
                    user.FullName,
                    RoleName = user.RoleId == 1 ? "Super Admin" : "Admin",
                    RoleId = user.RoleId
                }
            });
        }

        // =====================================================================
        // STAFF APIs — Áp dụng Staff-per-Branch logic
        // =====================================================================

        // Helper: Tìm Staff trong Branch context (hoặc fallback toàn hệ thống nếu không có locationId)
        // Staff-per-Branch: mỗi User record chỉ thuộc 1 Branch, xác định qua UserLocations
        private async Task<User?> FindStaffByPhoneInBranch(string phone, string? locationId)
        {
            // Nếu có locationId → tìm trong Branch cụ thể (Staff-per-Branch)
            if (!string.IsNullOrWhiteSpace(locationId))
            {
                var userLoc = await _context.UserLocations
                    .Include(ul => ul.User)
                    .FirstOrDefaultAsync(ul =>
                        ul.LocationId == locationId &&
                        ul.IsActive &&
                        ul.User != null &&
                        !ul.User.IsDeleted &&
                        (ul.User.PhoneNumber == phone || ul.User.FullName.ToLower() == phone.ToLower()) &&
                        (ul.User.RoleId == 1 || ul.User.RoleId == 2 || ul.User.RoleId == 3));

                return userLoc?.User;
            }

            // Fallback: không có locationId → tìm toàn hệ thống (backward-compatible)
            // Dùng cho các API client cũ chưa gửi locationId
            return await _context.Users.FirstOrDefaultAsync(u =>
                (u.PhoneNumber == phone || u.FullName.ToLower() == phone.ToLower()) &&
                (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3) &&
                !u.IsDeleted);
        }

        // 4. Kiểm tra luồng Nhân viên khi gõ SĐT ở Landing
        // Staff-per-Branch: tìm Staff trong Branch context
        [HttpPost("staff/check")]
        public async Task<IActionResult> CheckStaff([FromBody] StaffCheckDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await FindStaffByPhoneInBranch(phone, dto.LocationId);

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại trong hệ thống!" });
            }

            bool hasPin = !string.IsNullOrWhiteSpace(user.PinHash);
            bool bioEnabled = !string.IsNullOrWhiteSpace(user.BiometricKey);

            return Ok(new
            {
                message = "Nhân viên hợp lệ",
                id = user.Id,
                hasPin,
                bioEnabled,
                fullName = user.FullName,
                roleId = user.RoleId,
                phoneNumber = user.PhoneNumber,
                biometricKey = user.BiometricKey
            });
        }

        private string HashPin(string pin)
        {
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(pin);
                var hash = sha.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }

        // 5. Cài đặt mã PIN lần đầu cho nhân viên
        // Staff-per-Branch: PIN độc lập theo từng User/Branch record
        [HttpPost("staff/setup-pin")]
        public async Task<IActionResult> SetupPin([FromBody] SetupPinDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await FindStaffByPhoneInBranch(phone, dto.LocationId);

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại!" });
            }

            if (dto.Pin.Length != 6 || !int.TryParse(dto.Pin, out _))
            {
                return BadRequest(new { message = "Mã PIN phải gồm đúng 6 chữ số!" });
            }

            user.PinHash = HashPin(dto.Pin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cài đặt mã PIN thành công!" });
        }

        // 6. Xác thực mã PIN nhân viên (Fallback)
        // Staff-per-Branch: chỉ xác thực PIN của Staff trong đúng Branch
        [HttpPost("staff/verify-pin")]
        public async Task<IActionResult> VerifyPin([FromBody] VerifyPinDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await FindStaffByPhoneInBranch(phone, dto.LocationId);

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại!" });
            }

            // Hỗ trợ cả plain text (cho seed data) và hashed PIN
            if (user.PinHash == dto.Pin || user.PinHash == HashPin(dto.Pin))
            {
                return Ok(new { message = "Mã PIN chính xác!", success = true });
            }

            return BadRequest(new { message = "Mã PIN không chính xác! Vui lòng thử lại.", success = false });
        }

        // 6b. Đổi mã PIN của nhân viên
        // Staff-per-Branch: đổi PIN của Staff trong đúng Branch
        [HttpPost("staff/change-pin")]
        public async Task<IActionResult> ChangePin([FromBody] ChangePinDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await FindStaffByPhoneInBranch(phone, dto.LocationId);

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại!" });
            }

            var hashedOld = HashPin(dto.OldPin);
            if (user.PinHash != dto.OldPin && user.PinHash != hashedOld)
            {
                return BadRequest(new { message = "Mã PIN cũ không chính xác!" });
            }

            if (dto.NewPin.Length != 6 || !int.TryParse(dto.NewPin, out _))
            {
                return BadRequest(new { message = "Mã PIN mới phải gồm đúng 6 chữ số!" });
            }

            user.PinHash = HashPin(dto.NewPin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mã PIN thành công!" });
        }

        // 7. Bật/Liên kết xác thực Vân tay
        // Staff-per-Branch: Biometric độc lập theo từng User/Branch record
        [HttpPost("staff/setup-biometric")]
        public async Task<IActionResult> SetupBiometric([FromBody] SetupBiometricDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await FindStaffByPhoneInBranch(phone, dto.LocationId);

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại!" });
            }

            user.BiometricKey = dto.BiometricKey ?? "bio-mock-key-" + Guid.NewGuid().ToString().Substring(0, 8);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Liên kết vân tay thành công!" });
        }

        // 8. Xác thực Vân tay
        // Staff-per-Branch: chỉ xác thực Biometric của Staff trong đúng Branch
        [HttpPost("staff/verify-biometric")]
        public async Task<IActionResult> VerifyBiometric([FromBody] VerifyBiometricDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await FindStaffByPhoneInBranch(phone, dto.LocationId);

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại!" });
            }

            if (!string.IsNullOrWhiteSpace(user.BiometricKey) && user.BiometricKey == dto.BiometricKey)
            {
                return Ok(new { message = "Xác thực vân tay thành công!", success = true });
            }

            return BadRequest(new { message = "Xác thực vân tay thất bại hoặc không trùng khớp thiết bị!", success = false });
        }

        // 9. Lấy danh sách nhân viên
        // Staff-per-Branch: lọc theo locationId nếu có, trả toàn bộ nếu không có (Super Admin)
        [HttpGet("staff")]
        public async Task<IActionResult> GetStaff([FromQuery] string? locationId = null)
        {
            var query = _context.Users
                .Include(u => u.UserLocations)
                .Include(u => u.UserSkills)
                    .ThenInclude(us => us.Skill)
                .Where(u => (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3) && !u.IsDeleted);

            // Staff-per-Branch: nếu có locationId → chỉ trả Staff thuộc Branch đó
            if (!string.IsNullOrWhiteSpace(locationId))
            {
                query = query.Where(u => u.UserLocations.Any(ul => ul.LocationId == locationId && ul.IsActive));
            }

            var staffList = await query
                .Select(u => new
                {
                    id = u.Id,
                    phoneNumber = u.PhoneNumber,
                    fullName = u.FullName,
                    roleId = u.RoleId,
                    roleName = u.RoleId == 1 ? "Super Admin" : u.RoleId == 2 ? "Admin" : "Nhân viên ca trực",
                    hasPin = !string.IsNullOrWhiteSpace(u.PinHash),
                    bioEnabled = !string.IsNullOrWhiteSpace(u.BiometricKey),
                    hourlyWage = u.UserLocations.Any() ? u.UserLocations.FirstOrDefault()!.HourlyWage : 0,
                    locationId = u.UserLocations.Any() ? u.UserLocations.FirstOrDefault()!.LocationId : "",
                    locationIds = u.UserLocations.Select(ul => ul.LocationId).ToList(),
                    skills = u.UserSkills.Where(us => us.Skill != null && !us.Skill.IsDeleted).Select(us => new { id = us.Skill!.Id, name = us.Skill!.Name }).ToList()
                })
                .ToListAsync();

            return Ok(staffList);
        }

        [HttpGet("skills")]
        public async Task<IActionResult> GetSkills()
        {
            var list = await _context.Skills
                .Where(s => !s.IsDeleted)
                .Select(s => new { id = s.Id, name = s.Name })
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost("skills")]
        public async Task<IActionResult> CreateSkill([FromBody] CreateSkillDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Tên kỹ năng không được để trống!" });
            }
            var name = dto.Name.Trim();
            var exists = await _context.Skills.AnyAsync(s => s.Name.ToLower() == name.ToLower() && !s.IsDeleted);
            if (exists)
            {
                return BadRequest(new { message = "Kỹ năng này đã tồn tại!" });
            }
            var newSkill = new Skill
            {
                Id = "sk-" + Guid.NewGuid().ToString().Substring(0, 8),
                Name = name,
                IsDeleted = false
            };
            _context.Skills.Add(newSkill);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm kỹ năng thành công!", skill = new { id = newSkill.Id, name = newSkill.Name } });
        }

        // 10. Đăng ký nhân viên mới
        // Staff-per-Branch: Phone chỉ unique trong cùng Branch, được phép trùng ở Branch khác
        [HttpPost("staff/register")]
        public async Task<IActionResult> RegisterStaff([FromBody] StaffRegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(new { message = "Số điện thoại và Họ tên không được để trống!" });
            }

            var phone = dto.PhoneNumber.Trim();

            // Xác định Branch đang tạo Staff
            var targetLocationId = dto.LocationId;
            if (string.IsNullOrWhiteSpace(targetLocationId) && dto.LocationIds != null && dto.LocationIds.Any())
            {
                targetLocationId = dto.LocationIds.First();
            }
            if (string.IsNullOrWhiteSpace(targetLocationId))
            {
                targetLocationId = "govap-branch";
            }

            // Staff-per-Branch: chỉ kiểm tra trùng Phone trong cùng Branch, không chặn ở Branch khác
            var existingInBranch = await _context.UserLocations
                .AnyAsync(ul =>
                    ul.LocationId == targetLocationId &&
                    ul.IsActive &&
                    ul.User != null &&
                    ul.User.PhoneNumber == phone &&
                    !ul.User.IsDeleted &&
                    (ul.User.RoleId == 1 || ul.User.RoleId == 2 || ul.User.RoleId == 3));

            if (existingInBranch)
            {
                return BadRequest(new { message = "Số điện thoại này đã tồn tại trong chi nhánh!" });
            }

            var userId = "st-" + Guid.NewGuid().ToString().Substring(0, 8);
            var user = new User
            {
                Id = userId,
                RoleId = dto.RoleId, // 2: Admin, 3: Staff, 1: Super Admin
                PhoneNumber = phone,
                FullName = dto.FullName.Trim(),
                IsDeleted = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Gán UserLocation cho Staff — Staff chỉ thuộc 1 Branch (targetLocationId)
            var locIds = dto.LocationIds ?? new System.Collections.Generic.List<string>();
            if (locIds.Count == 0 && !string.IsNullOrWhiteSpace(dto.LocationId))
            {
                locIds.Add(dto.LocationId);
            }
            if (locIds.Count == 0)
            {
                locIds.Add("govap-branch");
            }

            foreach (var locId in locIds)
            {
                var locExists = await _context.Locations.AnyAsync(l => l.Id == locId);
                if (locExists)
                {
                    var userLoc = new UserLocation
                    {
                        Id = Guid.NewGuid().ToString(),
                        UserId = user.Id,
                        LocationId = locId,
                        HourlyWage = dto.HourlyWage,
                        IsActive = true
                    };
                    _context.UserLocations.Add(userLoc);
                }
            }
            await _context.SaveChangesAsync();

            if (dto.SkillIds != null && dto.SkillIds.Any())
            {
                foreach (var skillId in dto.SkillIds)
                {
                    _context.UserSkills.Add(new UserSkill { UserId = user.Id, SkillId = skillId });
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Đăng ký nhân sự thành công!",
                user = new
                {
                    user.Id,
                    user.PhoneNumber,
                    user.FullName,
                    RoleId = user.RoleId
                }
            });
        }

        // 11. Cập nhật thông tin nhân viên
        // Staff-per-Branch: chỉ cập nhật đúng User record đang được chọn (theo Id)
        // Phone unique chỉ kiểm tra trong cùng Branch của User đó
        [HttpPost("staff/update")]
        public async Task<IActionResult> UpdateStaff([FromBody] StaffUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Id))
            {
                return BadRequest(new { message = "Id nhân viên không được để trống!" });
            }

            var user = await _context.Users
                .Include(u => u.UserLocations)
                .FirstOrDefaultAsync(u => u.Id == dto.Id);

            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên!" });
            }

            if (dto.IsDeleted == true)
            {
                if (user.UserLocations != null)
                {
                    _context.UserLocations.RemoveRange(user.UserLocations);
                }
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã xóa hoàn toàn thông tin nhân viên!" });
            }

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                var phone = dto.PhoneNumber.Trim();

                // Staff-per-Branch: Phone chỉ kiểm tra unique trong Branch của User hiện tại
                // Lấy LocationId của User đang được cập nhật
                var userLocationId = user.UserLocations.FirstOrDefault()?.LocationId;

                if (!string.IsNullOrWhiteSpace(userLocationId))
                {
                    // Kiểm tra Phone trong cùng Branch, loại trừ chính User này
                    var phoneExistsInBranch = await _context.UserLocations
                        .AnyAsync(ul =>
                            ul.LocationId == userLocationId &&
                            ul.IsActive &&
                            ul.UserId != user.Id &&
                            ul.User != null &&
                            ul.User.PhoneNumber == phone &&
                            !ul.User.IsDeleted);

                    if (phoneExistsInBranch)
                    {
                        return BadRequest(new { message = "Số điện thoại này đã tồn tại trong chi nhánh!" });
                    }
                }
                else
                {
                    // Fallback: User chưa có Branch → kiểm tra toàn hệ thống (backward-compatible)
                    var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone && u.Id != dto.Id);
                    if (existingUser != null)
                    {
                        return BadRequest(new { message = "Số điện thoại này đã tồn tại trên hệ thống!" });
                    }
                }

                user.PhoneNumber = phone;
            }

            if (!string.IsNullOrWhiteSpace(dto.FullName))
            {
                user.FullName = dto.FullName.Trim();
            }

            if (dto.RoleId.HasValue)
            {
                user.RoleId = dto.RoleId.Value;
            }

            if (dto.HourlyWage.HasValue)
            {
                // Cập nhật lương tại Branch của User này
                foreach (var userLoc in user.UserLocations)
                {
                    userLoc.HourlyWage = dto.HourlyWage.Value;
                }
            }

            if (dto.LocationIds != null)
            {
                var existingLocs = await _context.UserLocations.Where(ul => ul.UserId == user.Id).ToListAsync();
                _context.UserLocations.RemoveRange(existingLocs);

                foreach (var locId in dto.LocationIds)
                {
                    var locExists = await _context.Locations.AnyAsync(l => l.Id == locId);
                    if (locExists)
                    {
                        var newLoc = new UserLocation
                        {
                            Id = Guid.NewGuid().ToString(),
                            UserId = user.Id,
                            LocationId = locId,
                            HourlyWage = dto.HourlyWage ?? (user.UserLocations.Any() ? user.UserLocations.First().HourlyWage : 25000),
                            IsActive = true
                        };
                        _context.UserLocations.Add(newLoc);
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(dto.LocationId))
            {
                var userLoc = user.UserLocations.FirstOrDefault();
                if (userLoc != null)
                {
                    userLoc.LocationId = dto.LocationId;
                }
                else
                {
                    var newLoc = new UserLocation
                    {
                        Id = Guid.NewGuid().ToString(),
                        UserId = user.Id,
                        LocationId = dto.LocationId,
                        HourlyWage = dto.HourlyWage ?? 25000,
                        IsActive = true
                    };
                    _context.UserLocations.Add(newLoc);
                }
            }

            if (dto.SkillIds != null)
            {
                var existing = await _context.UserSkills.Where(us => us.UserId == user.Id).ToListAsync();
                _context.UserSkills.RemoveRange(existing);

                foreach (var skillId in dto.SkillIds)
                {
                    _context.UserSkills.Add(new UserSkill { UserId = user.Id, SkillId = skillId });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin nhân viên thành công!" });
        }

        [HttpGet("debug/users")]
        public async Task<IActionResult> DebugUsers()
        {
            var users = await _context.Users.Select(u => new { u.Id, u.PhoneNumber, u.FullName, u.RoleId }).ToListAsync();
            return Ok(users);
        }
    }

    // --- Data Transfer Objects (DTOs) ---
    public class CustomerRegisterDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? LocationId { get; set; }
    }

    public class StaffRegisterDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int RoleId { get; set; } = 3; // 2: Admin, 3: Staff
        public string? LocationId { get; set; }
        public System.Collections.Generic.List<string>? LocationIds { get; set; }
        public decimal HourlyWage { get; set; } = 25000;
        public System.Collections.Generic.List<string>? SkillIds { get; set; }
    }

    public class StaffUpdateDto
    {
        public string Id { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? FullName { get; set; }
        public int? RoleId { get; set; }
        public string? LocationId { get; set; }
        public System.Collections.Generic.List<string>? LocationIds { get; set; }
        public decimal? HourlyWage { get; set; }
        public bool? IsDeleted { get; set; }
        public System.Collections.Generic.List<string>? SkillIds { get; set; }
    }

    public class CreateSkillDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class CustomerLoginDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string? LocationId { get; set; }
    }

    public class AdminLoginDto
    {
        public string Identifier { get; set; } = string.Empty;
    }

    // Staff-per-Branch: thêm LocationId để xác định Branch context
    public class StaffCheckDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string? LocationId { get; set; } // Branch context — null = backward-compatible fallback
    }

    // Staff-per-Branch: PIN độc lập theo Branch, thêm LocationId
    public class SetupPinDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
        public string? LocationId { get; set; } // Branch context
    }

    public class VerifyPinDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
        public string? LocationId { get; set; } // Branch context
    }

    // Staff-per-Branch: Biometric độc lập theo Branch, thêm LocationId
    public class SetupBiometricDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string? BiometricKey { get; set; }
        public string? LocationId { get; set; } // Branch context
    }

    public class VerifyBiometricDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string BiometricKey { get; set; } = string.Empty;
        public string? LocationId { get; set; } // Branch context
    }

    public class ChangePinDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string OldPin { get; set; } = string.Empty;
        public string NewPin { get; set; } = string.Empty;
        public string? LocationId { get; set; } // Branch context
    }
}
