using Microsoft.EntityFrameworkCore;
using TheMoods.Data.Models;

namespace TheMoods.Data.Contexts
{
    public class TenantDbContext : DbContext
    {
        public TenantDbContext(DbContextOptions<TenantDbContext> options) : base(options)
        {
        }

        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<Location> Locations { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Brand> Brands { get; set; } = null!;
        public DbSet<UserLocation> UserLocations { get; set; } = null!;
        public DbSet<CustomerPoint> CustomerPoints { get; set; } = null!;
        public DbSet<PointTransaction> PointTransactions { get; set; } = null!;
        public DbSet<StaffAvailability> StaffAvailabilities { get; set; } = null!;
        public DbSet<OfficialSchedule> OfficialSchedules { get; set; } = null!;
        public DbSet<Attendance> Attendances { get; set; } = null!;
        public DbSet<PayrollConfig> PayrollConfigs { get; set; } = null!;
        public DbSet<WeeklyPayroll> WeeklyPayrolls { get; set; } = null!;
        public DbSet<Skill> Skills { get; set; } = null!;
        public DbSet<UserSkill> UserSkills { get; set; } = null!;
        public DbSet<StaffRequest> StaffRequests { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<DeviceSubscription> DeviceSubscriptions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. PointTransactions relationships with two foreign keys to Users (Customer & Staff)
            modelBuilder.Entity<PointTransaction>()
                .HasOne(pt => pt.Customer)
                .WithMany(u => u.CustomerTransactions)
                .HasForeignKey(pt => pt.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PointTransaction>()
                .HasOne(pt => pt.Staff)
                .WithMany(u => u.StaffTransactions)
                .HasForeignKey(pt => pt.StaffId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PointTransaction>()
                .HasOne(pt => pt.Location)
                .WithMany(l => l.PointTransactions)
                .HasForeignKey(pt => pt.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 2. User & Role relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // 3. UserLocation relationships
            modelBuilder.Entity<UserLocation>()
                .HasOne(ul => ul.User)
                .WithMany(u => u.UserLocations)
                .HasForeignKey(ul => ul.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserLocation>()
                .HasOne(ul => ul.Location)
                .WithMany(l => l.UserLocations)
                .HasForeignKey(ul => ul.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 4. CustomerPoints relationships
            modelBuilder.Entity<CustomerPoint>()
                .HasOne(cp => cp.User)
                .WithMany(u => u.CustomerPoints)
                .HasForeignKey(cp => cp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerPoint>()
                .HasOne(cp => cp.Location)
                .WithMany(l => l.CustomerPoints)
                .HasForeignKey(cp => cp.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 5. StaffAvailability relationships
            modelBuilder.Entity<StaffAvailability>()
                .HasOne(sa => sa.User)
                .WithMany(u => u.StaffAvailabilities)
                .HasForeignKey(sa => sa.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StaffAvailability>()
                .HasOne(sa => sa.Location)
                .WithMany(l => l.StaffAvailabilities)
                .HasForeignKey(sa => sa.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 6. OfficialSchedule relationships
            modelBuilder.Entity<OfficialSchedule>()
                .HasOne(os => os.User)
                .WithMany(u => u.OfficialSchedules)
                .HasForeignKey(os => os.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OfficialSchedule>()
                .HasOne(os => os.Location)
                .WithMany(l => l.OfficialSchedules)
                .HasForeignKey(os => os.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 7. Attendance relationships
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Schedule)
                .WithMany(os => os.Attendances)
                .HasForeignKey(a => a.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.User)
                .WithMany(u => u.Attendances)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Location)
                .WithMany(l => l.Attendances)
                .HasForeignKey(a => a.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 8. PayrollConfig relationships
            modelBuilder.Entity<PayrollConfig>()
                .HasOne(pc => pc.Location)
                .WithMany(l => l.PayrollConfigs)
                .HasForeignKey(pc => pc.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 9. WeeklyPayroll relationships
            modelBuilder.Entity<WeeklyPayroll>()
                .HasOne(wp => wp.User)
                .WithMany(u => u.WeeklyPayrolls)
                .HasForeignKey(wp => wp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WeeklyPayroll>()
                .HasOne(wp => wp.Location)
                .WithMany(l => l.WeeklyPayrolls)
                .HasForeignKey(wp => wp.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            // 10. UserSkill relationships
            modelBuilder.Entity<UserSkill>()
                .HasKey(us => new { us.UserId, us.SkillId });

            modelBuilder.Entity<UserSkill>()
                .HasOne(us => us.User)
                .WithMany(u => u.UserSkills)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSkill>()
                .HasOne(us => us.Skill)
                .WithMany(s => s.UserSkills)
                .HasForeignKey(us => us.SkillId)
                .OnDelete(DeleteBehavior.Cascade);

            // 11. StaffRequest relationships
            modelBuilder.Entity<StaffRequest>()
                .HasOne(sr => sr.User)
                .WithMany(u => u.StaffRequests)
                .HasForeignKey(sr => sr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StaffRequest>()
                .HasOne(sr => sr.Location)
                .WithMany(l => l.StaffRequests)
                .HasForeignKey(sr => sr.LocationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
