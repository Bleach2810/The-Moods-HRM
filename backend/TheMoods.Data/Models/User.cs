using System;
using System.Collections.Generic;

namespace TheMoods.Data.Models
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public int RoleId { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PinHash { get; set; }
        public string? BiometricKey { get; set; }
        public string? QrCode { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? LastSettledDate { get; set; }

        // Navigation properties
        public Role? Role { get; set; }
        public ICollection<UserLocation> UserLocations { get; set; } = new List<UserLocation>();
        public ICollection<CustomerPoint> CustomerPoints { get; set; } = new List<CustomerPoint>();
        public ICollection<PointTransaction> CustomerTransactions { get; set; } = new List<PointTransaction>();
        public ICollection<PointTransaction> StaffTransactions { get; set; } = new List<PointTransaction>();
        public ICollection<StaffAvailability> StaffAvailabilities { get; set; } = new List<StaffAvailability>();
        public ICollection<OfficialSchedule> OfficialSchedules { get; set; } = new List<OfficialSchedule>();
        public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<WeeklyPayroll> WeeklyPayrolls { get; set; } = new List<WeeklyPayroll>();
        public ICollection<StaffRequest> StaffRequests { get; set; } = new List<StaffRequest>();
    }
}
