using System;
using System.Collections.Generic;

namespace TheMoods.Data.Models
{
    public class OfficialSchedule
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string LocationId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string CreatedBy { get; set; } = string.Empty; // ID của Admin tạo lịch

        // Navigation properties
        public User? User { get; set; }
        public Location? Location { get; set; }
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }
}
