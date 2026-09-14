using System;
using System.Collections.Generic;

namespace TheMoods.Data.Models
{
    public class Location
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string TenantId { get; set; } = string.Empty; // Mã thương hiệu (SaaS Tenant)
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        
        // Hạn chót đăng ký lịch làm việc (Ví dụ: Ngày thứ 5, lúc 23:59:00)
        public int DeadlineDay { get; set; } // 1 (Mon) - 7 (Sun)
        public TimeSpan DeadlineTime { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<UserLocation> UserLocations { get; set; } = new List<UserLocation>();
        public ICollection<CustomerPoint> CustomerPoints { get; set; } = new List<CustomerPoint>();
        public ICollection<PointTransaction> PointTransactions { get; set; } = new List<PointTransaction>();
        public ICollection<StaffAvailability> StaffAvailabilities { get; set; } = new List<StaffAvailability>();
        public ICollection<OfficialSchedule> OfficialSchedules { get; set; } = new List<OfficialSchedule>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<PayrollConfig> PayrollConfigs { get; set; } = new List<PayrollConfig>();
        public ICollection<WeeklyPayroll> WeeklyPayrolls { get; set; } = new List<WeeklyPayroll>();
        public ICollection<StaffRequest> StaffRequests { get; set; } = new List<StaffRequest>();
    }
}
