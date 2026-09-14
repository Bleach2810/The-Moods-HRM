using System;

namespace TheMoods.Data.Models
{
    public class PointTransaction
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string LocationId { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string StaffId { get; set; } = string.Empty;
        
        // ActionType: "Earn" (tích điểm) hoặc "Redeem" (đổi thưởng/sử dụng)
        public string ActionType { get; set; } = string.Empty; 
        public decimal BillAmount { get; set; }
        public int Points { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Location? Location { get; set; }
        public User? Customer { get; set; }
        public User? Staff { get; set; }
    }
}
