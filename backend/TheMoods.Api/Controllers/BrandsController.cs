using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using TheMoods.Data.Contexts;
using TheMoods.Data.Models;

namespace TheMoods.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrandsController : ControllerBase
    {
        private readonly TenantDbContext _context;

        public BrandsController(TenantDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetBrands()
        {
            var brands = await _context.Brands
                .Select(b => new {
                    id = b.Id,
                    name = b.Name,
                    code = b.Code,
                    logo = b.Logo,
                    status = b.Status,
                    plan = b.Plan,
                    monthlyFee = b.MonthlyFee,
                    customDomain = b.CustomDomain,
                    nextRenewal = b.NextRenewal.ToString("dd/MM/yyyy")
                })
                .ToListAsync();
            return Ok(brands);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBrand([FromBody] CreateBrandDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Code))
            {
                return BadRequest(new { message = "Tên thương hiệu và Mã định danh không được để trống!" });
            }

            var codeExists = await _context.Brands.AnyAsync(b => b.Code.ToLower() == dto.Code.ToLower());
            if (codeExists)
            {
                return BadRequest(new { message = "Mã định danh thương hiệu này đã tồn tại!" });
            }

            var newBrand = new Brand
            {
                Id = "b-" + Guid.NewGuid().ToString().Substring(0, 8),
                Name = dto.Name.Trim(),
                Code = dto.Code.Trim().ToLower(),
                Logo = "☕",
                Status = "active",
                Plan = dto.Plan ?? "Standard Tier",
                MonthlyFee = dto.MonthlyFee > 0 ? dto.MonthlyFee : 3000000,
                CustomDomain = dto.CustomDomain?.Trim() ?? string.Empty,
                NextRenewal = DateTime.UtcNow.AddDays(30)
            };

            _context.Brands.Add(newBrand);
            await _context.SaveChangesAsync();

            return Ok(new {
                message = "Tạo thương hiệu thành công!",
                brand = new {
                    id = newBrand.Id,
                    name = newBrand.Name,
                    code = newBrand.Code,
                    logo = newBrand.Logo,
                    status = newBrand.Status,
                    plan = newBrand.Plan,
                    monthlyFee = newBrand.MonthlyFee,
                    customDomain = newBrand.CustomDomain,
                    nextRenewal = newBrand.NextRenewal.ToString("dd/MM/yyyy")
                }
            });
        }

        [HttpPost("toggle-status")]
        public async Task<IActionResult> ToggleStatus([FromBody] ToggleStatusDto dto)
        {
            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Id == dto.BrandId);
            if (brand == null)
            {
                return NotFound(new { message = "Thương hiệu không tồn tại!" });
            }

            brand.Status = brand.Status == "active" ? "suspended" : "active";
            
            // Cascade status to locations matching the brand code
            var locations = await _context.Locations.Where(l => l.TenantId == brand.Code).ToListAsync();
            foreach (var loc in locations)
            {
                loc.IsActive = brand.Status == "active";
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã thay đổi trạng thái thương hiệu thành: {brand.Status}", status = brand.Status });
        }

        [HttpPost("location")]
        public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.BrandId) || string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Thiếu BrandId hoặc Tên chi nhánh!" });
            }

            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Id == dto.BrandId);
            if (brand == null)
            {
                return NotFound(new { message = "Thương hiệu chủ quản không tồn tại!" });
            }

            var newLoc = new Location
            {
                Id = "l-" + Guid.NewGuid().ToString().Substring(0, 8),
                TenantId = brand.Code, // links to brand code
                Name = $"{brand.Name} - {dto.Name.Trim()}",
                IsActive = brand.Status == "active"
            };

            _context.Locations.Add(newLoc);
            await _context.SaveChangesAsync();

            return Ok(new {
                message = "Tạo chi nhánh thành công!",
                location = new {
                    id = newLoc.Id,
                    brandId = newLoc.TenantId,
                    name = newLoc.Name,
                    status = newLoc.IsActive ? "active" : "suspended"
                }
            });
        }
    }

    public class CreateBrandDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Plan { get; set; }
        public decimal MonthlyFee { get; set; }
        public string? CustomDomain { get; set; }
    }

    public class ToggleStatusDto
    {
        public string BrandId { get; set; } = string.Empty;
    }

    public class CreateLocationDto
    {
        public string BrandId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}
