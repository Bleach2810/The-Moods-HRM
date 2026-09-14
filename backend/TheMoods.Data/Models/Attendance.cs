using System;

namespace TheMoods.Data.Models
{
    public class Attendance
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ScheduleId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string LocationId { get; set; } = string.Empty;
        public DateTime CheckInTime { get; set; } = DateTime.UtcNow;
        public DateTime? CheckOutTime { get; set; }
        public double Lat { get; set; }
        public double Lng { get; set; }

        // Navigation properties
        public OfficialSchedule? Schedule { get; set; }
        public User? User { get; set; }
        public Location? Location { get; set; }
    }
}
