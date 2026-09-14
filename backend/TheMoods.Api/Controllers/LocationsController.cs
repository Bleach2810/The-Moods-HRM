using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using TheMoods.Data.Contexts;

namespace TheMoods.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationsController : ControllerBase
    {
        private readonly TenantDbContext _context;

        public LocationsController(TenantDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLocations()
        {
            var locations = await _context.Locations
                .Select(l => new {
                    id = l.Id,
                    brandId = l.TenantId,
                    name = l.Name,
                    status = l.IsActive ? "active" : "suspended"
                })
                .ToListAsync();

            return Ok(locations);
        }
    }
}
