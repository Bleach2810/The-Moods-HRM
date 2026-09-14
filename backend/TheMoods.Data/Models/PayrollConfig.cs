using System;

namespace TheMoods.Data.Models
{
    public class PayrollConfig
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string LocationId { get; set; } = string.Empty;
        public string ConfigKey { get; set; } = string.Empty; // Ví dụ: "LatePenaltyPerMinute", "BonusThreshold"
        public string ConfigValue { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public Location? Location { get; set; }
    }
}
