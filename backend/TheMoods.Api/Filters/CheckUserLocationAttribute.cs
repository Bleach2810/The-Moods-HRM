using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Linq;
using System.Threading.Tasks;
using TheMoods.Data.Contexts;

namespace TheMoods.Api.Filters
{
    public class CheckUserLocationAttribute : IAsyncActionFilter
    {
        private readonly TenantDbContext _context;

        public CheckUserLocationAttribute(TenantDbContext context)
        {
            _context = context;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            string locationId = null;
            string userId = null;

            // Lấy từ Query
            if (context.HttpContext.Request.Query.ContainsKey("locationId"))
                locationId = context.HttpContext.Request.Query["locationId"].ToString();
            if (context.HttpContext.Request.Query.ContainsKey("userId"))
                userId = context.HttpContext.Request.Query["userId"].ToString();

            // Nếu endpoint có yêu cầu locationId và userId
            if (!string.IsNullOrEmpty(locationId) && !string.IsNullOrEmpty(userId))
            {
                var exists = _context.UserLocations.Any(ul => ul.UserId == userId && ul.LocationId == locationId && ul.IsActive);
                if (!exists)
                {
                    context.Result = new ObjectResult(new { message = "Lỗi bảo mật: Bạn không có quyền truy cập vào không gian dữ liệu của chi nhánh này!" })
                    {
                        StatusCode = 403
                    };
                    return;
                }
            }

            await next();
        }
    }
}
