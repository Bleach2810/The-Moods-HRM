using System.Collections.Generic;

namespace TheMoods.Data.Models
{
    public class Skill
    {
        public string Id { get; set; } = System.Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public bool IsDeleted { get; set; } = false;

        // Navigation property
        public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
    }
}
