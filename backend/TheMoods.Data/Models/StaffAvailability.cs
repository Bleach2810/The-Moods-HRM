using System;

namespace TheMoods.Data.Models
{
    public class StaffAvailability
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string LocationId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public double TotalHours { get; set; }

        // Navigation properties
        public User? User { get; set; }
        public Location? Location { get; set; }
    }
}
