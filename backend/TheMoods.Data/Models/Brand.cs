using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TheMoods.Data.Models
{
    [Table("Brands")]
    public class Brand
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Logo { get; set; } = "☕";
        public string Status { get; set; } = "active";
        public string Plan { get; set; } = "Standard Tier";
        public decimal MonthlyFee { get; set; } = 3000000;
        public string? CustomDomain { get; set; } = string.Empty;
        public DateTime NextRenewal { get; set; } = DateTime.UtcNow.AddDays(30);
    }
}
