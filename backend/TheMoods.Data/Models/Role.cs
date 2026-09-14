using System;
using System.Collections.Generic;

namespace TheMoods.Data.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string RoleName { get; set; } = string.Empty;

        // Navigation properties
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
