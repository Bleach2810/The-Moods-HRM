using System;

namespace TheMoods.Data.Models
{
    public class ShiftExtension
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string LocationId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        
        // Người yêu cầu kéo ca (người đến trễ hoặc cần kéo ca)
        public string RequesterId { get; set; } = string.Empty;
        public virtual User? Requester { get; set; }
        
        // Người thực tế kéo ca (người làm thay / tăng cường - nhận lương)
        public string CovererId { get; set; } = string.Empty;
        public virtual User? Coverer { get; set; }
        
        // Ca trực gốc của người yêu cầu (nếu có, để biết kéo cho ca nào)
        public string? RequesterShiftId { get; set; }
        public virtual OfficialSchedule? RequesterShift { get; set; }
        
        // Ca trực của người kéo ca (nếu người kéo ca cũng đang có ca, optional!)
        public string? CovererShiftId { get; set; }
        public virtual OfficialSchedule? CovererShift { get; set; }
        
        // Thời lượng kéo ca (ví dụ: 30, 60, 90, 120 phút...)
        public int DurationMinutes { get; set; }
        
        // Số giờ làm tròn 1 chữ số thập phân (ví dụ: 0.5, 1.0, 1.5, 2.0...)
        public double Hours { get; set; }
        
        // Mức lương giờ tại thời điểm kéo ca
        public decimal HourlyWage { get; set; }
        
        // Số tiền tính = Hours * HourlyWage
        public decimal Amount { get; set; }
        
        // Ghi chú / lý do
        public string Note { get; set; } = string.Empty;
        
        // Trạng thái: "pending" | "approved" | "rejected"
        public string Status { get; set; } = "approved";
        
        // ID của StaffRequest tương ứng (nếu phát sinh từ đơn)
        public string? RequestId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Location? Location { get; set; }
    }
}
