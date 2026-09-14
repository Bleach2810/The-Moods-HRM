using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using TheMoods.Data.Contexts;
using TheMoods.Data.Models;

namespace TheMoods.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly TenantDbContext _context;

        public CustomersController(TenantDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách khách hàng toàn bộ (bao gồm ID, UID dùng cho QR)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCustomers()
        {
            var customers = await _context.Users
                .Where(u => u.RoleId == 4 && !u.IsDeleted)
                .Select(u => new
                {
                    id = u.Id,
                    phone = u.PhoneNumber,
                    name = u.FullName,
                    email = "",
                    points = u.CustomerPoints.Sum(cp => cp.TotalPoints),
                    qrCode = u.QrCode,
                    vouchers = new object[] {}
                })
                .ToListAsync();

            return Ok(customers);
        }

        /// <summary>
        /// Tra cứu khách hàng bằng dữ liệu QR code (JSON chứa id hoặc phone)
        /// Admin/Staff quét QR của khách hàng → gửi nội dung QR lên API → nhận lại thông tin khách
        /// </summary>
        [HttpPost("lookup-qr")]
        public async Task<IActionResult> LookupByQr([FromBody] QrLookupDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.QrData))
            {
                return BadRequest(new { message = "Dữ liệu QR không được để trống!" });
            }

            string? qrId = null;
            string? qrPhone = null;

            // Thử parse QR data dưới dạng JSON {"id":"...","phone":"..."}
            try
            {
                using var doc = JsonDocument.Parse(dto.QrData);
                var root = doc.RootElement;
                if (root.TryGetProperty("id", out var idProp))
                    qrId = idProp.GetString();
                if (root.TryGetProperty("phone", out var phoneProp))
                    qrPhone = phoneProp.GetString();
            }
            catch
            {
                // Nếu không phải JSON, thử dùng trực tiếp là phone number
                qrPhone = dto.QrData.Trim();
            }

            // Tìm khách hàng bằng ID (ưu tiên) hoặc SĐT
            User? user = null;
            if (!string.IsNullOrWhiteSpace(qrId))
            {
                user = await _context.Users
                    .Include(u => u.CustomerPoints)
                    .FirstOrDefaultAsync(u => u.Id == qrId && u.RoleId == 4 && !u.IsDeleted);
            }
            if (user == null && !string.IsNullOrWhiteSpace(qrPhone))
            {
                user = await _context.Users
                    .Include(u => u.CustomerPoints)
                    .FirstOrDefaultAsync(u => u.PhoneNumber == qrPhone && u.RoleId == 4 && !u.IsDeleted);
            }

            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng nào với mã QR này!" });
            }

            var locId = dto.LocationId ?? "govap-branch";
            var wallet = user.CustomerPoints.FirstOrDefault(w => w.LocationId == locId);
            int points = wallet?.TotalPoints ?? user.CustomerPoints.Sum(cp => cp.TotalPoints);

            return Ok(new
            {
                message = "Tìm thấy khách hàng!",
                customer = new
                {
                    user.Id,
                    user.PhoneNumber,
                    user.FullName,
                    user.QrCode,
                    Points = points
                }
            });
        }

        /// <summary>
        /// Cộng điểm cho khách hàng sau khi quét QR tích điểm
        /// Tính: BillAmount / 50,000 VND = số điểm cộng
        /// Lưu PointTransaction + cập nhật CustomerPoint
        /// </summary>
        [HttpPost("add-points")]
        public async Task<IActionResult> AddPoints([FromBody] AddPointsDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CustomerId))
            {
                return BadRequest(new { message = "Mã khách hàng không được để trống!" });
            }

            if (dto.BillAmount <= 0)
            {
                return BadRequest(new { message = "Số tiền hóa đơn phải lớn hơn 0!" });
            }

            var customer = await _context.Users
                .Include(u => u.CustomerPoints)
                .FirstOrDefaultAsync(u => u.Id == dto.CustomerId && u.RoleId == 4 && !u.IsDeleted);

            if (customer == null)
            {
                return NotFound(new { message = "Khách hàng không tồn tại!" });
            }

            var locId = dto.LocationId ?? "govap-branch";
            int pointsToAdd = (int)Math.Floor(dto.BillAmount / 50000m);

            if (pointsToAdd <= 0)
            {
                return BadRequest(new { message = "Hóa đơn quá nhỏ, không đủ để tích điểm (tối thiểu 50,000 VND)!" });
            }

            // Tìm hoặc tạo ví điểm tại chi nhánh
            var wallet = customer.CustomerPoints.FirstOrDefault(cp => cp.LocationId == locId);
            if (wallet == null)
            {
                wallet = new CustomerPoint
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = customer.Id,
                    LocationId = locId,
                    TotalPoints = 0,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.CustomerPoints.Add(wallet);
            }

            wallet.TotalPoints += pointsToAdd;
            wallet.UpdatedAt = DateTime.UtcNow;

            // Lưu giao dịch tích điểm
            var transaction = new PointTransaction
            {
                Id = Guid.NewGuid().ToString(),
                LocationId = locId,
                CustomerId = customer.Id,
                StaffId = dto.StaffId ?? "system",
                ActionType = "Earn",
                BillAmount = dto.BillAmount,
                Points = pointsToAdd,
                CreatedAt = DateTime.UtcNow
            };
            _context.PointTransactions.Add(transaction);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Tích điểm thành công! +{pointsToAdd} điểm từ hóa đơn {dto.BillAmount:N0}đ.",
                pointsAdded = pointsToAdd,
                totalPoints = wallet.TotalPoints,
                customer = new
                {
                    customer.Id,
                    customer.PhoneNumber,
                    customer.FullName,
                    Points = wallet.TotalPoints
                }
            });
        }

        /// <summary>
        /// Lấy lịch sử giao dịch điểm của một khách hàng
        /// </summary>
        [HttpGet("{customerId}/transactions")]
        public async Task<IActionResult> GetTransactions(string customerId)
        {
            var transactions = await _context.PointTransactions
                .Where(pt => pt.CustomerId == customerId)
                .OrderByDescending(pt => pt.CreatedAt)
                .Select(pt => new
                {
                    pt.Id,
                    pt.ActionType,
                    pt.BillAmount,
                    pt.Points,
                    pt.CreatedAt,
                    pt.LocationId
                })
                .Take(50)
                .ToListAsync();

            return Ok(transactions);
        }
    }

    // --- DTOs ---
    public class QrLookupDto
    {
        public string QrData { get; set; } = string.Empty;
        public string? LocationId { get; set; }
    }

    public class AddPointsDto
    {
        public string CustomerId { get; set; } = string.Empty;
        public decimal BillAmount { get; set; }
        public string? LocationId { get; set; }
        public string? StaffId { get; set; }
    }
}
