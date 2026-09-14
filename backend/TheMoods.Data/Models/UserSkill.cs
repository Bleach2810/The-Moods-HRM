namespace TheMoods.Data.Models
{
    public class UserSkill
    {
        public string UserId { get; set; } = string.Empty;
        public string SkillId { get; set; } = string.Empty;

        // Navigation properties
        public User? User { get; set; }
        public Skill? Skill { get; set; }
    }
}
