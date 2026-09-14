using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using TheMoods.Data.Contexts;
using TheMoods.Data.Models;

namespace TheMoods.Data.Initializer
{
    public static class DbInitializer
    {
        public static void Initialize(TenantDbContext context)
        {
            // Tự động chạy Migration nếu DB chưa được khởi tạo đầy đủ
            context.Database.Migrate();

            // Check if seeded staff user has incorrect ID. If so, wipe and re-seed.
            var legacyStaff = context.Users.FirstOrDefault(u => u.PhoneNumber == "0900000003");
            if (legacyStaff != null && legacyStaff.Id != "st-3")
            {
                using var transaction = context.Database.BeginTransaction();
                try
                {
                    context.Database.ExecuteSqlRaw("TRUNCATE TABLE \"Attendances\", \"OfficialSchedules\", \"StaffAvailabilities\", \"UserLocations\", \"Users\" CASCADE");
                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                }
            }

            // 1. Seed Roles
            if (!context.Roles.Any())
            {
                context.Roles.AddRange(
                    new Role { Id = 1, RoleName = "Super Admin" },
                    new Role { Id = 2, RoleName = "Admin" },
                    new Role { Id = 3, RoleName = "Staff" },
                    new Role { Id = 4, RoleName = "Customer" }
                );
                context.SaveChanges();
            }

            // 2. Seed default Location để gán cho Admin/Staff
            if (!context.Locations.Any())
            {
                context.Locations.Add(
                    new Location
                    {
                        Id = "govap-branch",
                        TenantId = "themoods", // Mã định danh Brand/Tenant SaaS
                        Name = "The Moods Gò Vấp",
                        Address = "Quang Trung, Gò Vấp, TP. HCM",
                        DeadlineDay = 4, // Thứ 5
                        DeadlineTime = new TimeSpan(23, 59, 0),
                        IsActive = true
                    }
                );
                context.SaveChanges();
            }

            // 3. Seed Users (Super Admin, Admin, Staff)
            if (!context.Users.Any(u => u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3))
            {
                // Mật khẩu PIN cho Staff mặc định là "123456"
                // Trong thực tế sẽ dùng thư viện mã hóa bcrypt, tạm thời lưu text hoặc hash đơn giản
                var superAdmin = new User
                {
                    Id = "st-1",
                    RoleId = 1, // Super Admin
                    PhoneNumber = "0900000001",
                    FullName = "Super Admin",
                    PinHash = null,
                    BiometricKey = null,
                    QrCode = "QR_SUPERADMIN",
                    IsDeleted = false
                };

                var adminUser = new User
                {
                    Id = "st-2",
                    RoleId = 2, // Admin
                    PhoneNumber = "0900000002",
                    FullName = "Quản lý Gò Vấp",
                    PinHash = null,
                    BiometricKey = null,
                    QrCode = "QR_ADMIN",
                    IsDeleted = false
                };

                var staffUser = new User
                {
                    Id = "st-3",
                    RoleId = 3, // Staff
                    PhoneNumber = "0900000003",
                    FullName = "Nhân viên Nguyễn Văn A",
                    PinHash = "123456", // Mã PIN mặc định để đăng nhập
                    BiometricKey = "bio-mock-key-123",
                    QrCode = "QR_STAFF_A",
                    IsDeleted = false
                };

                context.Users.AddRange(superAdmin, adminUser, staffUser);
                context.SaveChanges();

                // Gán Staff và Admin vào chi nhánh Gò Vấp
                context.UserLocations.AddRange(
                    new UserLocation
                    {
                        Id = Guid.NewGuid().ToString(),
                        UserId = adminUser.Id,
                        LocationId = "govap-branch",
                        HourlyWage = 0, // Admin lương cố định hoặc không tính theo giờ
                        IsActive = true
                    },
                    new UserLocation
                    {
                        Id = Guid.NewGuid().ToString(),
                        UserId = staffUser.Id,
                        LocationId = "govap-branch",
                        HourlyWage = 25000, // 25,000 VND / giờ
                        IsActive = true
                    }
                );
                context.SaveChanges();
            }

            // 4. Seed default Skills
            if (!context.Skills.Any())
            {
                context.Skills.AddRange(
                    new Skill { Id = "sk-1", Name = "Pha chế", IsDeleted = false },
                    new Skill { Id = "sk-2", Name = "Phục vụ", IsDeleted = false },
                    new Skill { Id = "sk-3", Name = "Thu ngân", IsDeleted = false }
                );
                context.SaveChanges();

                // Assign default skills to staff Nguyễn Văn A (st-3)
                if (context.Users.Any(u => u.Id == "st-3"))
                {
                    context.UserSkills.AddRange(
                        new UserSkill { UserId = "st-3", SkillId = "sk-1" },
                        new UserSkill { UserId = "st-3", SkillId = "sk-2" }
                    );
                    context.SaveChanges();
                }
            }
        }
    }
}
