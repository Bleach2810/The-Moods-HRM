using System;

namespace TheMoods.Data.Models
{
    public class StaffRequest
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = null!;
        public User? User { get; set; }
        public string LocationId { get; set; } = null!;
        public Location? Location { get; set; }
        public string Type { get; set; } = null!; // "leave" | "swap"
        public string Details { get; set; } = null!;
        public string Date { get; set; } = null!; // YYYY-MM-DD
        public string Status { get; set; } = "pending"; // "pending" | "approved" | "rejected"
        public string? TargetShiftId { get; set; }
        public string? SwapWithStaffName { get; set; }
        public string? SwapWithStaffId { get; set; }
        public string? SwapWithShiftId { get; set; }
        
        // Fields for Shift Extension
        public TimeSpan? OriginalStartTime { get; set; }
        public TimeSpan? RequestedStartTime { get; set; }
        public TimeSpan? RequestedEndTime { get; set; }
        public int? ExtensionDurationMinutes { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
