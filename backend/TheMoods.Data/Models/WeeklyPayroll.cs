using System;

namespace TheMoods.Data.Models
{
    public class WeeklyPayroll
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string LocationId { get; set; } = string.Empty;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public double TotalWorkedHours { get; set; }
        public decimal HourlyWage { get; set; }
        public decimal BaseSalary { get; set; }
        public decimal TotalBonus { get; set; }
        public decimal TotalPenalty { get; set; }
        public decimal TotalAdvance { get; set; }
        public decimal FinalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User? User { get; set; }
        public Location? Location { get; set; }
    }
}

