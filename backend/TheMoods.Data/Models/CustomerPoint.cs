using System;

namespace TheMoods.Data.Models
{
    public class CustomerPoint
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string LocationId { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User? User { get; set; }
        public Location? Location { get; set; }
    }
}
