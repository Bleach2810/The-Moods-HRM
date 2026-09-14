using System;

namespace TheMoods.Data.Models
{
    public class UserLocation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string LocationId { get; set; } = string.Empty;
        public decimal HourlyWage { get; set; } // Lương theo giờ tại chi nhánh này
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public User? User { get; set; }
        public Location? Location { get; set; }
    }
}
