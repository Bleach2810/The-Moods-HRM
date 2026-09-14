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

        // 1. Đăng ký khách hàng mới
        [HttpPost("customer/register")]
        public async Task<IActionResult> RegisterCustomer([FromBody] CustomerRegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(new { message = "Số điện thoại và Họ tên không được để trống!" });
            }

            var phone = dto.PhoneNumber.Trim();
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone);

            if (existingUser != null)
            {
                return BadRequest(new { message = "Số điện thoại này đã được đăng ký thành viên!" });
            }

            var customerId = Guid.NewGuid().ToString();
            // Tạo User mới với Role Customer (ID = 4)
            var customer = new User
            {
                Id = customerId,
                RoleId = 4, // Customer
                PhoneNumber = phone,
                FullName = dto.FullName.Trim(),
                QrCode = "{\"id\":\"" + customerId + "\",\"phone\":\"" + phone + "\"}", // Set to JSON structure
                IsDeleted = false
            };

            _context.Users.Add(customer);
            await _context.SaveChangesAsync();

            // Khởi tạo ví điểm cho khách hàng tại chi nhánh hiện tại (nếu có truyền LocationId)
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

        // 2. Đăng nhập khách hàng bằng SĐT (Tạm thời bỏ qua gửi OTP thật, mock thành công)
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

            // Lấy điểm số tại chi nhánh hiện tại
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

        // 3. Đăng nhập Admin / Super Admin (Chỉ kiểm tra phone và quyền hạn)
        [HttpPost("admin/login")]
        public async Task<IActionResult> LoginAdmin([FromBody] AdminLoginDto dto)
        {
            var val = dto.Identifier.Trim().ToLower();

            // Cho phép gõ "admin", "super" để dev nhanh như frontend
            User? user = null;
            if (val == "super" || val == "saas")
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.RoleId == 1); // Super Admin
            }
            else if (val == "admin")
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.RoleId == 2); // Admin
            }
            else
            {
                // Tìm kiếm theo số điện thoại hoặc tên đăng nhập chính xác
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

        // 4. Kiểm tra luồng Nhân viên (Staff Flow) khi gõ SĐT ở Landing
        [HttpPost("staff/check")]
        public async Task<IActionResult> CheckStaff([FromBody] StaffCheckDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.PhoneNumber == phone || u.FullName.ToLower() == phone.ToLower()) && 
                (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3));

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

        // 5. Cài đặt mã PIN lần đầu cho nhân viên (Momo-style setup PIN)
        [HttpPost("staff/setup-pin")]
        public async Task<IActionResult> SetupPin([FromBody] SetupPinDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.PhoneNumber == phone || u.FullName.ToLower() == phone.ToLower()) && 
                (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4));

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại!" });
            }

            if (dto.Pin.Length != 6 || !int.TryParse(dto.Pin, out _))
            {
                return BadRequest(new { message = "Mã PIN phải gồm đúng 6 chữ số!" });
            }

            user.PinHash = HashPin(dto.Pin); // Lưu mã PIN đã hash
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cài đặt mã PIN thành công!" });
        }

        // 6. Xác thực mã PIN nhân viên (Fallback)
        [HttpPost("staff/verify-pin")]
        public async Task<IActionResult> VerifyPin([FromBody] VerifyPinDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.PhoneNumber == phone || u.FullName.ToLower() == phone.ToLower()) && 
                (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4));

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
        [HttpPost("staff/change-pin")]
        public async Task<IActionResult> ChangePin([FromBody] ChangePinDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.PhoneNumber == phone || u.FullName.ToLower() == phone.ToLower()) && 
                (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4));

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

        // 7. Bật/Liên kết xác thực Vân tay cho những lần sau (Momo-style biometric linkage)
        [HttpPost("staff/setup-biometric")]
        public async Task<IActionResult> SetupBiometric([FromBody] SetupBiometricDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.PhoneNumber == phone || u.FullName.ToLower() == phone.ToLower()) && 
                (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4));

            if (user == null)
            {
                return NotFound(new { message = "Nhân viên không tồn tại!" });
            }

            user.BiometricKey = dto.BiometricKey ?? "bio-mock-key-" + Guid.NewGuid().ToString().Substring(0, 8);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Liên kết vân tay thành công!" });
        }

        // 8. Xác thực Vân tay (0.5 giây vô ca chấm công)
        [HttpPost("staff/verify-biometric")]
        public async Task<IActionResult> VerifyBiometric([FromBody] VerifyBiometricDto dto)
        {
            var phone = dto.PhoneNumber.Trim();
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.PhoneNumber == phone || u.FullName.ToLower() == phone.ToLower()) && 
                (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4));

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
        [HttpGet("staff")]
        public async Task<IActionResult> GetStaff()
        {
            var staffList = await _context.Users
                .Include(u => u.UserLocations)
                .Include(u => u.UserSkills)
                    .ThenInclude(us => us.Skill)
                .Where(u => (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3) && !u.IsDeleted)
                .Select(u => new
                {
                    id = u.Id,
                    phoneNumber = u.PhoneNumber,
                    fullName = u.FullName,
                    roleId = u.RoleId,
                    roleName = u.RoleId == 1 ? "Super Admin" : u.RoleId == 2 ? "Admin" : "Nhân viên ca trực",
                    hasPin = u.PinHash != null && u.PinHash != "",
                    bioEnabled = u.BiometricKey != null && u.BiometricKey != "",
                    hourlyWage = u.UserLocations.Select(ul => (decimal?)ul.HourlyWage).FirstOrDefault() ?? 0m,
                    locationId = u.UserLocations.Select(ul => ul.LocationId).FirstOrDefault() ?? "",
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
        [HttpPost("staff/register")]
        public async Task<IActionResult> RegisterStaff([FromBody] StaffRegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(new { message = "Số điện thoại và Họ tên không được để trống!" });
            }

            var phone = dto.PhoneNumber.Trim();
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone);

            if (existingUser != null)
            {
                return BadRequest(new { message = "Số điện thoại này đã tồn tại trên hệ thống!" });
            }

            var userId = "st-" + Guid.NewGuid().ToString().Substring(0, 8);
            var user = new User
            {
                Id = userId,
                RoleId = dto.RoleId, // 2: Admin, 3: Staff/Nhân viên, 1: Super Admin
                PhoneNumber = phone,
                FullName = dto.FullName.Trim(),
                IsDeleted = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Khởi tạo UserLocation cho nhân viên tại chi nhánh
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
                user.IsDeleted = true;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã cập nhật trạng thái nghỉ việc cho nhân viên!" });
            }

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                var phone = dto.PhoneNumber.Trim();
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone && u.Id != dto.Id);
                if (existingUser != null)
                {
                    return BadRequest(new { message = "Số điện thoại này đã tồn tại trên hệ thống!" });
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

    public class StaffCheckDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class SetupPinDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
    }

    public class VerifyPinDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
    }

    public class SetupBiometricDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string? BiometricKey { get; set; }
    }

    public class VerifyBiometricDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string BiometricKey { get; set; } = string.Empty;
    }

    public class ChangePinDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string OldPin { get; set; } = string.Empty;
        public string NewPin { get; set; } = string.Empty;
    }
}
