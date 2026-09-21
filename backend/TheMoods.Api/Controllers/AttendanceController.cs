using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using TheMoods.Data.Contexts;
using TheMoods.Data.Models;

namespace TheMoods.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly TenantDbContext _context;

        public AttendanceController(TenantDbContext context)
        {
            _context = context;
        }

        // 1. Lấy cấu hình HRM & Lương thưởng phạt
        [HttpGet("config")]
        public async Task<IActionResult> GetConfig([FromQuery] string locationId)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";

            var configs = await _context.PayrollConfigs
                .Where(c => c.LocationId == locationId && c.IsActive)
                .ToListAsync();

            // Đảm bảo có cấu hình mặc định nếu chưa tồn tại
            if (!configs.Any(c => c.ConfigKey == "ShiftRegistrationLocked"))
            {
                var defLock = new PayrollConfig { LocationId = locationId, ConfigKey = "ShiftRegistrationLocked", ConfigValue = "false", Description = "Trạng thái đóng cổng đăng ký ca rảnh" };
                _context.PayrollConfigs.Add(defLock);
                configs.Add(defLock);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "LatePenaltyRule"))
            {
                var defPenalty = new PayrollConfig { LocationId = locationId, ConfigKey = "LatePenaltyRule", ConfigValue = "10:0.5,20:1.0,30:2.0", Description = "Mốc phạt đi trễ theo hệ số lương (Phút:Hệ số, ví dụ 10:0.5 nghĩa là trễ 10 phút phạt 0.5 giờ lương)" };
                _context.PayrollConfigs.Add(defPenalty);
                configs.Add(defPenalty);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "Holidays"))
            {
                var defHolidays = new PayrollConfig { LocationId = locationId, ConfigKey = "Holidays", ConfigValue = "2026-01-01,2026-04-30,2026-05-01", Description = "Danh sách ngày nghỉ lễ (YYYY-MM-DD)" };
                _context.PayrollConfigs.Add(defHolidays);
                configs.Add(defHolidays);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "HolidayMultiplier"))
            {
                var defHolidayMult = new PayrollConfig { LocationId = locationId, ConfigKey = "HolidayMultiplier", ConfigValue = "2.0", Description = "Hệ số nhân lương khi đi làm vào ngày lễ (ví dụ 2.0 = gấp đôi, 3.0 = gấp ba)" };
                _context.PayrollConfigs.Add(defHolidayMult);
                configs.Add(defHolidayMult);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "ActiveBonus"))
            {
                var defBonus = new PayrollConfig { LocationId = locationId, ConfigKey = "ActiveBonus", ConfigValue = "100000", Description = "Thưởng nóng hiệu suất" };
                _context.PayrollConfigs.Add(defBonus);
                configs.Add(defBonus);
                await _context.SaveChangesAsync();
            }

            // Mốc phạt đi trễ công thức mới
            if (!configs.Any(c => c.ConfigKey == "LatePenaltyStartMinutes"))
            {
                var defStart = new PayrollConfig { LocationId = locationId, ConfigKey = "LatePenaltyStartMinutes", ConfigValue = "10", Description = "Số phút trễ bắt đầu phạt" };
                _context.PayrollConfigs.Add(defStart);
                configs.Add(defStart);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "LatePenaltyBaseAmount"))
            {
                var defBase = new PayrollConfig { LocationId = locationId, ConfigKey = "LatePenaltyBaseAmount", ConfigValue = "50000", Description = "Số tiền phạt mốc đầu tiên (VNĐ)" };
                _context.PayrollConfigs.Add(defBase);
                configs.Add(defBase);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "LatePenaltyIntervalMinutes"))
            {
                var defInterval = new PayrollConfig { LocationId = locationId, ConfigKey = "LatePenaltyIntervalMinutes", ConfigValue = "10", Description = "Khoảng tăng phút kế tiếp để tính nhân hệ số" };
                _context.PayrollConfigs.Add(defInterval);
                configs.Add(defInterval);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "LatePenaltyMultiplier"))
            {
                var defMultiplier = new PayrollConfig { LocationId = locationId, ConfigKey = "LatePenaltyMultiplier", ConfigValue = "2", Description = "Hệ số nhân số tiền phạt sau mỗi khoảng tăng" };
                _context.PayrollConfigs.Add(defMultiplier);
                configs.Add(defMultiplier);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "LatePenaltyMaxAmount"))
            {
                var defMax = new PayrollConfig { LocationId = locationId, ConfigKey = "LatePenaltyMaxAmount", ConfigValue = "500000", Description = "Giới hạn số tiền phạt tối đa (VNĐ)" };
                _context.PayrollConfigs.Add(defMax);
                configs.Add(defMax);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "Holidays_Detailed"))
            {
                var defHolidaysDetailed = new PayrollConfig
                {
                    LocationId = locationId,
                    ConfigKey = "Holidays_Detailed",
                    ConfigValue = "[{\"Date\":\"2026-01-01\",\"Note\":\"Tết Dương Lịch\",\"Multiplier\":2.0,\"FlatBonus\":0},{\"Date\":\"2026-02-17\",\"Note\":\"Tết Âm Lịch (Mùng 1)\",\"Multiplier\":3.0,\"FlatBonus\":0},{\"Date\":\"2026-02-18\",\"Note\":\"Tết Âm Lịch (Mùng 2)\",\"Multiplier\":3.0,\"FlatBonus\":0},{\"Date\":\"2026-02-19\",\"Note\":\"Tết Âm Lịch (Mùng 3)\",\"Multiplier\":3.0,\"FlatBonus\":0},{\"Date\":\"2026-03-03\",\"Note\":\"Tết Nguyên Tiêu\",\"Multiplier\":2.0,\"FlatBonus\":0},{\"Date\":\"2026-04-30\",\"Note\":\"Giải phóng Miền Nam\",\"Multiplier\":2.0,\"FlatBonus\":0},{\"Date\":\"2026-05-01\",\"Note\":\"Quốc tế Lao động\",\"Multiplier\":2.0,\"FlatBonus\":0}]",
                    Description = "Danh sách ngày lễ chi tiết có ghi chú (JSON)"
                };
                _context.PayrollConfigs.Add(defHolidaysDetailed);
                configs.Add(defHolidaysDetailed);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "Adjustments"))
            {
                var defAdjustments = new PayrollConfig
                {
                    LocationId = locationId,
                    ConfigKey = "Adjustments",
                    ConfigValue = "[]",
                    Description = "Danh sách thưởng phạt riêng của nhân viên (JSON)"
                };
                _context.PayrollConfigs.Add(defAdjustments);
                configs.Add(defAdjustments);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "GpsLatitude"))
            {
                var defLat = new PayrollConfig { LocationId = locationId, ConfigKey = "GpsLatitude", ConfigValue = "10.8315", Description = "Vĩ độ định vị GPS của chi nhánh" };
                _context.PayrollConfigs.Add(defLat);
                configs.Add(defLat);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "GpsLongitude"))
            {
                var defLng = new PayrollConfig { LocationId = locationId, ConfigKey = "GpsLongitude", ConfigValue = "106.6645", Description = "Kinh độ định vị GPS của chi nhánh" };
                _context.PayrollConfigs.Add(defLng);
                configs.Add(defLng);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "GpsRadius"))
            {
                var defRadius = new PayrollConfig { LocationId = locationId, ConfigKey = "GpsRadius", ConfigValue = "50", Description = "Bán kính GPS giới hạn cho phép chấm công (mét)" };
                _context.PayrollConfigs.Add(defRadius);
                configs.Add(defRadius);
                await _context.SaveChangesAsync();
            }

            if (!configs.Any(c => c.ConfigKey == "ManagerNote"))
            {
                var defNote = new PayrollConfig { LocationId = locationId, ConfigKey = "ManagerNote", ConfigValue = "Chúc mọi người một tuần làm việc vui vẻ!", Description = "Ghi chú của quản lý cho nhân viên" };
                _context.PayrollConfigs.Add(defNote);
                configs.Add(defNote);
                await _context.SaveChangesAsync();
            }

            return Ok(configs.Select(c => new { c.ConfigKey, c.ConfigValue, c.Description }));
        }

        // 2. Cập nhật cấu hình HRM & Lương thưởng phạt
        [HttpPost("config")]
        public async Task<IActionResult> SaveConfig([FromBody] List<ConfigUpdateDto> dto, [FromQuery] string locationId)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";

            foreach (var item in dto)
            {
                var config = await _context.PayrollConfigs
                    .FirstOrDefaultAsync(c => c.LocationId == locationId && c.ConfigKey == item.ConfigKey);

                if (config != null)
                {
                    config.ConfigValue = item.ConfigValue;
                    if (!string.IsNullOrEmpty(item.Description))
                    {
                        config.Description = item.Description;
                    }
                }
                else
                {
                    _context.PayrollConfigs.Add(new PayrollConfig
                    {
                        LocationId = locationId,
                        ConfigKey = item.ConfigKey,
                        ConfigValue = item.ConfigValue,
                        Description = item.Description ?? "",
                        IsActive = true
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Lưu cấu hình thành công!" });
        }

        // 2b. Xóa cấu hình HRM & Lương thưởng phạt
        [HttpPost("config/delete")]
        public async Task<IActionResult> DeleteConfig([FromQuery] string locationId, [FromQuery] string key)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";
            var config = await _context.PayrollConfigs.FirstOrDefaultAsync(c => c.LocationId == locationId && c.ConfigKey == key);
            if (config != null)
            {
                _context.PayrollConfigs.Remove(config);
                await _context.SaveChangesAsync();
            }
            return Ok(new { message = "Xóa cấu hình thành công!" });
        }

        // 3. Nhân viên đăng ký ca rảnh
        [HttpPost("availability")]
        public async Task<IActionResult> RegisterAvailability([FromBody] AvailabilityRegisterDto dto)
        {
            var lockConfig = await _context.PayrollConfigs
                .FirstOrDefaultAsync(c => c.LocationId == dto.LocationId && c.ConfigKey == "ShiftRegistrationLocked");
            
            if (lockConfig != null && lockConfig.ConfigValue.ToLower() == "true")
            {
                return BadRequest(new { message = "Cổng đăng ký ca rảnh hiện đang bị khóa! Vui lòng liên hệ quản lý." });
            }

            var startTime = TimeSpan.Parse(dto.StartTime);
            var endTime = TimeSpan.Parse(dto.EndTime);
            var totalHours = (endTime - startTime).TotalHours;
            if (totalHours < 0)
            {
                totalHours += 24;
            }

            if (totalHours < 4.0)
            {
                return BadRequest(new { message = "Mỗi ca đăng ký rảnh phải tối thiểu 4 tiếng!" });
            }

            var dateVal = DateTime.SpecifyKind(DateTime.Parse(dto.Date).Date, DateTimeKind.Utc);

            // Calculate proposed availability time range
            var newStart = dateVal.Add(startTime);
            var newEnd = dateVal.Add(endTime);
            if (endTime < startTime)
            {
                newEnd = newEnd.AddDays(1);
            }

            // Get schedules and existing availabilities around the date to check for overlaps
            var prevDate = dateVal.AddDays(-1);
            var nextDate = dateVal.AddDays(1);
            var schedules = await _context.OfficialSchedules
                .Where(s => s.UserId == dto.UserId && s.LocationId == dto.LocationId && s.Date >= prevDate && s.Date <= nextDate)
                .ToListAsync();

            var existing = await _context.StaffAvailabilities
                .Where(sa => sa.UserId == dto.UserId && sa.LocationId == dto.LocationId && sa.Date >= prevDate && sa.Date <= nextDate)
                .ToListAsync();

            // 1. Check overlap with official schedules
            foreach (var s in schedules)
            {
                var sStart = s.Date.Add(s.StartTime);
                var sEnd = s.Date.Add(s.EndTime);
                if (s.EndTime < s.StartTime)
                {
                    sEnd = sEnd.AddDays(1);
                }

                if (sStart < newEnd && sEnd > newStart)
                {
                    return BadRequest(new { message = $"Khung giờ này đã được xếp lịch làm việc ({s.StartTime.ToString(@"hh\:mm")} - {s.EndTime.ToString(@"hh\:mm")}). Không thể đăng ký!" });
                }
            }

            // 2. Check overlap with existing availabilities
            foreach (var sa in existing)
            {
                var saStart = sa.Date.Add(sa.StartTime);
                var saEnd = sa.Date.Add(sa.EndTime);
                if (sa.EndTime < sa.StartTime)
                {
                    saEnd = saEnd.AddDays(1);
                }

                if (saStart < newEnd && saEnd > newStart)
                {
                    return BadRequest(new { message = $"Khung giờ này trùng với ca rảnh bạn đã đăng ký trước đó ({sa.StartTime.ToString(@"hh\:mm")} - {sa.EndTime.ToString(@"hh\:mm")})!" });
                }
            }

            var avail = new StaffAvailability
            {
                UserId = dto.UserId,
                LocationId = dto.LocationId,
                Date = dateVal,
                StartTime = startTime,
                EndTime = endTime,
                TotalHours = totalHours
            };

            _context.StaffAvailabilities.Add(avail);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký ca rảnh thành công!", availId = avail.Id });
        }

        // 3b. Nhân viên xóa ca rảnh đã đăng ký
        [HttpDelete("availability/{id}")]
        public async Task<IActionResult> DeleteAvailability(string id)
        {
            var avail = await _context.StaffAvailabilities.FindAsync(id);
            if (avail == null)
            {
                return NotFound(new { message = "Ca rảnh không tồn tại!" });
            }

            // Kiểm tra xem ca rảnh này đã được xếp lịch chưa
            var dateVal = avail.Date;
            var prevDate = dateVal.AddDays(-1);
            var nextDate = dateVal.AddDays(1);
            var schedules = await _context.OfficialSchedules
                .Where(s => s.UserId == avail.UserId && s.LocationId == avail.LocationId && s.Date >= prevDate && s.Date <= nextDate)
                .ToListAsync();

            var saStart = avail.Date.Add(avail.StartTime);
            var saEnd = avail.Date.Add(avail.EndTime);
            if (avail.EndTime < avail.StartTime)
            {
                saEnd = saEnd.AddDays(1);
            }

            foreach (var s in schedules)
            {
                var sStart = s.Date.Add(s.StartTime);
                var sEnd = s.Date.Add(s.EndTime);
                if (s.EndTime < s.StartTime)
                {
                    sEnd = sEnd.AddDays(1);
                }

                if (sStart < saEnd && sEnd > saStart)
                {
                    return BadRequest(new { message = $"Bạn đã được xếp lịch làm việc ({s.StartTime.ToString(@"hh\:mm")} - {s.EndTime.ToString(@"hh\:mm")}) dựa trên ca rảnh này. Không thể xóa!" });
                }
            }

            _context.StaffAvailabilities.Remove(avail);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa ca rảnh thành công!" });
        }

        // 4. Lấy danh sách đăng ký ca rảnh của chi nhánh
        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailabilities([FromQuery] string locationId)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";

            var avails = await _context.StaffAvailabilities
                .Include(sa => sa.User)
                    .ThenInclude(u => u!.UserSkills)
                        .ThenInclude(us => us.Skill)
                .Where(sa => sa.LocationId == locationId)
                .OrderBy(sa => sa.Date)
                .Select(sa => new
                {
                    sa.Id,
                    sa.UserId,
                    staffName = sa.User != null ? sa.User.FullName : "Nhân viên",
                    staffPhone = sa.User != null ? sa.User.PhoneNumber : "",
                    date = sa.Date.ToString("yyyy-MM-dd"),
                    startTime = sa.StartTime.ToString(@"hh\:mm"),
                    endTime = sa.EndTime.ToString(@"hh\:mm"),
                    sa.TotalHours,
                    skills = sa.User != null ? sa.User.UserSkills.Where(us => us.Skill != null && !us.Skill.IsDeleted).Select(us => (object)new { id = us.Skill.Id, name = us.Skill.Name }).ToList() : new System.Collections.Generic.List<object>()
                })
                .ToListAsync();

            return Ok(avails);
        }

        // 5. Xuất danh sách ca rảnh nhân viên ra định dạng Excel (.xlsx)
        [HttpGet("availability/export")]
        public async Task<IActionResult> ExportAvailabilities([FromQuery] string locationId)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";

            var avails = await _context.StaffAvailabilities
                .Include(sa => sa.User)
                .Where(sa => sa.LocationId == locationId)
                .OrderBy(sa => sa.Date)
                .ToListAsync();

            using var workbook = new ClosedXML.Excel.XLWorkbook();
            var ws = workbook.Worksheets.Add("Ca Ranh Nhan Vien");

            // Header row
            ws.Cell(1, 1).Value = "Ho ten";
            ws.Cell(1, 2).Value = "So dien thoai";
            ws.Cell(1, 3).Value = "Ngay dang ky";
            ws.Cell(1, 4).Value = "Thu";
            ws.Cell(1, 5).Value = "Gio bat dau";
            ws.Cell(1, 6).Value = "Gio ket thuc";
            ws.Cell(1, 7).Value = "Tong so gio ranh";

            var headerRange = ws.Range(1, 1, 1, 7);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#7c4831");
            headerRange.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
            headerRange.Style.Alignment.Horizontal = ClosedXML.Excel.XLAlignmentHorizontalValues.Center;

            for (int i = 0; i < avails.Count; i++)
            {
                var sa = avails[i];
                string thuStr = sa.Date.DayOfWeek switch
                {
                    DayOfWeek.Monday => "Thứ Hai",
                    DayOfWeek.Tuesday => "Thứ Ba",
                    DayOfWeek.Wednesday => "Thứ Tư",
                    DayOfWeek.Thursday => "Thứ Năm",
                    DayOfWeek.Friday => "Thứ Sáu",
                    DayOfWeek.Saturday => "Thứ Bảy",
                    DayOfWeek.Sunday => "Chủ Nhật",
                    _ => ""
                };

                ws.Cell(i + 2, 1).Value = sa.User?.FullName ?? "";
                ws.Cell(i + 2, 2).Value = sa.User?.PhoneNumber ?? "";
                ws.Cell(i + 2, 3).Value = sa.Date.ToString("yyyy-MM-dd");
                ws.Cell(i + 2, 4).Value = thuStr;

                var startCell = ws.Cell(i + 2, 5);
                startCell.Value = sa.StartTime.ToString(@"hh\:mm");
                startCell.Style.NumberFormat.Format = "@";

                var endCell = ws.Cell(i + 2, 6);
                endCell.Value = sa.EndTime.ToString(@"hh\:mm");
                endCell.Style.NumberFormat.Format = "@";

                ws.Cell(i + 2, 7).Value = sa.TotalHours;
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"DangKy_CaRanh_{locationId}_{DateTime.Now:yyyyMMdd}.xlsx"
            );
        }

        // 6. Admin xếp lịch ca làm việc chính thức
        [HttpPost("schedules")]
        public async Task<IActionResult> CreateSchedule([FromBody] ScheduleCreateDto dto)
        {
            var dateVal = DateTime.SpecifyKind(DateTime.Parse(dto.Date).Date, DateTimeKind.Utc);
            var startTime = TimeSpan.Parse(dto.StartTime);
            var endTime = TimeSpan.Parse(dto.EndTime);

            // Kiểm tra xem nhân viên đã được gán ca này chưa
            var existing = await _context.OfficialSchedules
                .AnyAsync(s => s.UserId == dto.UserId && s.Date == dateVal && s.StartTime == startTime && s.EndTime == endTime);

            if (existing)
            {
                return BadRequest(new { message = "Lịch trực ca này của nhân viên đã tồn tại!" });
            }

            var sched = new OfficialSchedule
            {
                UserId = dto.UserId,
                LocationId = dto.LocationId,
                Date = dateVal,
                StartTime = startTime,
                EndTime = endTime,
                CreatedBy = dto.CreatedBy ?? "Admin"
            };

            _context.OfficialSchedules.Add(sched);
            await _context.SaveChangesAsync();

            // Notify staff about new schedule
            try
            {
                var user = await _context.Users.FindAsync(dto.UserId);
                if (user != null)
                {
                    var schedNotif = new Notification
                    {
                        UserId = dto.UserId,
                        Title = "Lịch làm việc mới",
                        Message = $"Bạn đã được xếp ca trực mới ngày {dto.Date} ({dto.StartTime} - {dto.EndTime})."
                    };
                    _context.Notifications.Add(schedNotif);
                    await _context.SaveChangesAsync();

                    // Check if shift is tomorrow (next day)
                    var localToday = DateTime.UtcNow.AddHours(7).Date;
                    var localSchedDate = dateVal.AddHours(7).Date;
                    if (localSchedDate == localToday.AddDays(1))
                    {
                        await SendPushNotification(dto.UserId, "Lịch trực ngày mai", $"Bạn có ca trực vào ngày mai ({dto.Date}) lúc {dto.StartTime} - {dto.EndTime}.");
                    }
                    else
                    {
                        await SendPushNotification(dto.UserId, schedNotif.Title, schedNotif.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error sending schedule notification: " + ex.Message);
            }

            return Ok(new { message = "Xếp ca làm việc chính thức thành công!", scheduleId = sched.Id });
        }

        // 7. Lấy danh sách lịch ca trực chính thức
        [HttpGet("schedules")]
        public async Task<IActionResult> GetSchedules([FromQuery] string locationId, [FromQuery] string? userId = null)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";

            var query = _context.OfficialSchedules
                .Include(s => s.User)
                    .ThenInclude(u => u!.UserSkills)
                        .ThenInclude(us => us.Skill)
                .Include(s => s.Attendances)
                .Where(s => s.LocationId == locationId);

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(s => s.UserId == userId);
            }

            var scheds = await query
                .OrderBy(s => s.Date)
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    staffName = s.User != null ? s.User.FullName : "Nhân viên",
                    staffPhone = s.User != null ? s.User.PhoneNumber : "",
                    date = s.Date.ToString("yyyy-MM-dd"),
                    startTime = s.StartTime.ToString(@"hh\:mm"),
                    endTime = s.EndTime.ToString(@"hh\:mm"),
                    clockedIn = s.Attendances.Any(),
                    clockedOut = s.Attendances.Any(a => a.CheckOutTime != null),
                    checkInTime = s.Attendances.Any() ? s.Attendances.First().CheckInTime.ToString("HH:mm:ss") : null,
                    checkOutTime = s.Attendances.Any(a => a.CheckOutTime != null) ? s.Attendances.First().CheckOutTime.Value.ToString("HH:mm:ss") : null,
                    skills = s.User != null ? s.User.UserSkills.Where(us => us.Skill != null && !us.Skill.IsDeleted).Select(us => (object)new { id = us.Skill.Id, name = us.Skill.Name }).ToList() : new System.Collections.Generic.List<object>()
                })
                .ToListAsync();

            return Ok(scheds);
        }

        // 7b. Xóa lịch ca trực chính thức
        [HttpDelete("schedules/{id}")]
        public async Task<IActionResult> DeleteSchedule(string id)
        {
            var sched = await _context.OfficialSchedules
                .Include(s => s.Attendances)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sched == null)
            {
                return NotFound(new { message = "Lịch trực không tồn tại!" });
            }

            if (sched.Attendances.Any())
            {
                return BadRequest(new { message = "Không thể xóa lịch trực đã có chấm công!" });
            }

            // Xóa cả ca rảnh tương ứng của nhân viên vào ngày hôm đó
            var avails = await _context.StaffAvailabilities
                .Where(sa => sa.UserId == sched.UserId && sa.Date == sched.Date)
                .ToListAsync();
            
            var overlappingAvails = avails.Where(sa => 
                (sa.StartTime < sched.EndTime && sa.EndTime > sched.StartTime) ||
                (sched.EndTime < sched.StartTime && (sa.StartTime < sched.EndTime.Add(TimeSpan.FromDays(1)) || sa.EndTime > sched.StartTime))
            ).ToList();

            if (overlappingAvails.Any())
            {
                _context.StaffAvailabilities.RemoveRange(overlappingAvails);
            }

            _context.OfficialSchedules.Remove(sched);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa lịch trực thành công!" });
        }

        // 7c. Sửa lịch ca trực chính thức
        [HttpPut("schedules/{id}")]
        public async Task<IActionResult> UpdateSchedule(string id, [FromBody] ScheduleCreateDto dto)
        {
            var sched = await _context.OfficialSchedules
                .Include(s => s.Attendances)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sched == null)
            {
                return NotFound(new { message = "Lịch trực không tồn tại!" });
            }

            if (sched.Attendances.Any())
            {
                return BadRequest(new { message = "Không thể sửa lịch trực đã có chấm công!" });
            }

            sched.UserId = dto.UserId;
            sched.LocationId = dto.LocationId;
            sched.Date = DateTime.SpecifyKind(DateTime.Parse(dto.Date).Date, DateTimeKind.Utc);
            sched.StartTime = TimeSpan.Parse(dto.StartTime);
            sched.EndTime = TimeSpan.Parse(dto.EndTime);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật lịch trực thành công!" });
        }

        // 8. Chấm công Vào ca (Clock-In)
        [HttpPost("clock-in")]
        public async Task<IActionResult> ClockIn([FromBody] ClockInDto dto)
        {
            var configs = await _context.PayrollConfigs
                .Where(c => c.LocationId == dto.LocationId && c.IsActive)
                .ToListAsync();

            double storeLat = 10.8315;
            double storeLng = 106.6645;
            double allowedRadius = 50.0;

            var latConfig = configs.FirstOrDefault(c => c.ConfigKey == "GpsLatitude")?.ConfigValue;
            var lngConfig = configs.FirstOrDefault(c => c.ConfigKey == "GpsLongitude")?.ConfigValue;
            var radiusConfig = configs.FirstOrDefault(c => c.ConfigKey == "GpsRadius")?.ConfigValue;

            if (double.TryParse(latConfig, out double parsedLat)) storeLat = parsedLat;
            if (double.TryParse(lngConfig, out double parsedLng)) storeLng = parsedLng;
            if (double.TryParse(radiusConfig, out double parsedRadius)) allowedRadius = parsedRadius;

            double distance = CalculateDistance(dto.Lat, dto.Lng, storeLat, storeLng);

            // Bán kính GPS cho phép
            if (distance > allowedRadius)
            {
                return BadRequest(new { message = $"Bạn đang ở cách xa chi nhánh ({Math.Round(distance)}m). Vui lòng di chuyển tới quán (bán kính {allowedRadius}m) để chấm công!" });
            }

            var localToday = DateTime.UtcNow.AddHours(7).Date; // Giờ VN hôm nay
            var localYesterday = localToday.AddDays(-1);

            // Tìm các ca trực hôm qua và hôm nay của nhân viên chưa được chấm công
            var schedules = await _context.OfficialSchedules
                .Include(s => s.Attendances)
                .Where(s => s.UserId == dto.UserId && (s.Date == localToday || s.Date == localYesterday) && s.LocationId == dto.LocationId)
                .ToListAsync();

            // Lọc ra các ca chưa được check-in
            var eligibleSchedules = schedules.Where(s => !s.Attendances.Any()).ToList();

            if (!eligibleSchedules.Any())
            {
                return BadRequest(new { message = "Hôm nay bạn không được xếp ca trực chính thức tại chi nhánh này hoặc bạn đã chấm công hết rồi!" });
            }

            // Chọn ca phù hợp nhất dựa trên khoảng cách thời gian giữa giờ hiện tại và giờ bắt đầu ca trực
            OfficialSchedule? targetSchedule = null;
            double minTimeDiffMinutes = double.MaxValue;

            var nowTime = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc); // Giờ VN hiện tại

            foreach (var s in eligibleSchedules)
            {
                var schedStart = s.Date.Date.Add(s.StartTime);
                schedStart = DateTime.SpecifyKind(schedStart, DateTimeKind.Utc);

                var diff = Math.Abs((nowTime - schedStart).TotalMinutes);
                var timeFromStart = (nowTime - schedStart).TotalMinutes;
                // Nhận ca nếu thời gian hiện tại nằm trong khoảng -120 phút đến +360 phút (hoặc ca đêm hôm qua)
                if (timeFromStart >= -120 && timeFromStart <= 360)
                {
                    if (diff < minTimeDiffMinutes)
                    {
                        minTimeDiffMinutes = diff;
                        targetSchedule = s;
                    }
                }
            }

            if (targetSchedule == null)
            {
                return BadRequest(new { message = "Không tìm thấy ca trực phù hợp trong khung giờ hiện tại của bạn!" });
            }

            var scheduleStart = DateTime.SpecifyKind(targetSchedule.Date.Date.Add(targetSchedule.StartTime), DateTimeKind.Utc);
            double lateMin = 0;
            if (nowTime > scheduleStart)
            {
                lateMin = (nowTime - scheduleStart).TotalMinutes;
            }

            var att = new Attendance
            {
                ScheduleId = targetSchedule.Id,
                UserId = dto.UserId,
                LocationId = dto.LocationId,
                CheckInTime = nowTime,
                CheckOutTime = null,
                Lat = dto.Lat,
                Lng = dto.Lng
            };

            _context.Attendances.Add(att);
            await _context.SaveChangesAsync();

            // Notify branch admins if staff is late by 10 minutes or more
            if (lateMin >= 10.0)
            {
                try
                {
                    var user = await _context.Users.FindAsync(dto.UserId);
                    var branchAdmins = await _context.UserLocations
                        .Include(ul => ul.User)
                        .Where(ul => ul.LocationId == dto.LocationId && (ul.User!.RoleId == 1 || ul.User!.RoleId == 2))
                        .Select(ul => ul.UserId)
                        .ToListAsync();

                    foreach (var adminId in branchAdmins)
                    {
                        var adminNotif = new Notification
                        {
                            UserId = adminId,
                            Title = "Nhân viên đi trễ",
                            Message = $"Nhân sự {user?.FullName} đã vào ca trễ {Math.Round(lateMin)} phút (Ca: {targetSchedule.StartTime} - {targetSchedule.EndTime})."
                        };
                        _context.Notifications.Add(adminNotif);
                        await SendPushNotification(adminId, adminNotif.Title, adminNotif.Message);
                    }
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error sending late notification: " + ex.Message);
                }
            }

            return Ok(new
            {
                message = "Vào ca thành công!",
                checkInTime = nowTime.ToString("HH:mm:ss"),
                lateMinutes = Math.Round(lateMin),
                distance = Math.Round(distance)
            });
        }

        // 9. Chấm công Ra ca (Clock-Out)
        [HttpPost("clock-out")]
        public async Task<IActionResult> ClockOut([FromBody] ClockOutDto dto)
        {
            var today = DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
            var att = await _context.Attendances
                .Include(a => a.Schedule)
                .Where(a => a.UserId == dto.UserId && a.LocationId == dto.LocationId && a.CheckOutTime == null)
                .OrderByDescending(a => a.CheckInTime)
                .FirstOrDefaultAsync();

            if (att == null)
            {
                return BadRequest(new { message = "Bạn chưa chấm công Vào ca!" });
            }

             var nowTime = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc); // Giờ VN
             DateTime scheduleEnd;
             if (att.Schedule != null)
             {
                 var baseDate = att.Schedule.Date.Date;
                 scheduleEnd = DateTime.SpecifyKind(baseDate.Add(att.Schedule.EndTime), DateTimeKind.Utc);
                 if (att.Schedule.EndTime < att.Schedule.StartTime)
                 {
                     scheduleEnd = scheduleEnd.AddDays(1);
                 }
             }
             else
             {
                 scheduleEnd = nowTime;
             }

            // Auto-checkout rule: Không cho phép tính giờ làm thêm OT vượt quá giờ kết thúc ca chính thức
            DateTime actualEndTime = nowTime;
            bool isEarlyCheckout = false;
            double earlyMinutes = 0;

            if (nowTime < scheduleEnd)
            {
                isEarlyCheckout = true;
                earlyMinutes = (scheduleEnd - nowTime).TotalMinutes;
            }
            else
            {
                // Nếu làm quá giờ ca trực thì tự động chốt checkout đúng giờ ca trực kết thúc (No OT)
                actualEndTime = scheduleEnd;
            }

            att.CheckOutTime = nowTime; // Lưu thời gian bấm nút thực tế
            await _context.SaveChangesAsync();

            double hoursWorked = (actualEndTime - att.CheckInTime).TotalHours;
            if (hoursWorked < 0) hoursWorked = 0;

            return Ok(new
            {
                message = isEarlyCheckout 
                    ? $"Ra ca thành công! Cảnh báo: Bạn đã về sớm {Math.Round(earlyMinutes)} phút trước khi hết ca." 
                    : "Ra ca thành công!",
                checkOutTime = nowTime.ToString("HH:mm:ss"),
                hoursWorked = Math.Round(hoursWorked, 1),
                isEarly = isEarlyCheckout,
                earlyMinutes = Math.Round(earlyMinutes)
            });
        }

        // 10. Tính lương tự động (Payroll) cho chi nhánh
        [HttpGet("payroll")]
        public async Task<IActionResult> GetPayroll([FromQuery] string locationId, [FromQuery] string fromDate, [FromQuery] string toDate)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";
            var start = DateTime.Parse(fromDate).Date;
            var end = DateTime.Parse(toDate).Date;

            // Load configs
            var configs = await _context.PayrollConfigs.Where(c => c.LocationId == locationId && c.IsActive).ToListAsync();
            
            // New Late Penalty formula parameters
            var startMinsConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyStartMinutes")?.ConfigValue;
            var baseAmtConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyBaseAmount")?.ConfigValue;
            var intervalMinsConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyIntervalMinutes")?.ConfigValue;
            var multiplierConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyMultiplier")?.ConfigValue;
            var maxAmtConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyMaxAmount")?.ConfigValue;

            int startMins = 10;
            decimal baseAmt = 50000;
            int intervalMins = 10;
            double multiplier = 2;
            decimal maxAmt = 500000;

            if (int.TryParse(startMinsConfig, out int parsedStart)) startMins = parsedStart;
            if (decimal.TryParse(baseAmtConfig, out decimal parsedBase)) baseAmt = parsedBase;
            if (int.TryParse(intervalMinsConfig, out int parsedInterval)) intervalMins = parsedInterval;
            if (double.TryParse(multiplierConfig, out double parsedMultiplier)) multiplier = parsedMultiplier;
            if (decimal.TryParse(maxAmtConfig, out decimal parsedMax)) maxAmt = parsedMax;

            // Parse Holidays_Detailed
            var holidaysDetailedStr = configs.FirstOrDefault(c => c.ConfigKey == "Holidays_Detailed")?.ConfigValue;
            var holidayMap = new Dictionary<string, HolidayDetail>(StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrEmpty(holidaysDetailedStr))
            {
                try
                {
                    var detailedList = JsonSerializer.Deserialize<List<HolidayDetail>>(holidaysDetailedStr);
                    if (detailedList != null)
                    {
                        foreach (var h in detailedList)
                        {
                            if (DateTime.TryParse(h.Date, out DateTime hDate))
                            {
                                var dateKey = hDate.ToString("yyyy-MM-dd");
                                holidayMap[dateKey] = h;
                            }
                        }
                    }
                }
                catch { }
            }

            // Custom Adjustments (individual bonus/penalty)
            var adjustmentsStr = configs.FirstOrDefault(c => c.ConfigKey == "Adjustments")?.ConfigValue;
            var adjustmentsList = new List<PayrollAdjustment>();
            if (!string.IsNullOrEmpty(adjustmentsStr))
            {
                try
                {
                    adjustmentsList = JsonSerializer.Deserialize<List<PayrollAdjustment>>(adjustmentsStr) ?? new List<PayrollAdjustment>();
                }
                catch
                {
                    // Ignore parsing error
                }
            }

            var activeBonusStr = configs.FirstOrDefault(c => c.ConfigKey == "ActiveBonus")?.ConfigValue ?? "100000";
            decimal defaultShiftBonus = 0;
            decimal.TryParse(activeBonusStr, out defaultShiftBonus);

            // Lấy danh sách toàn bộ nhân viên (Super Admin Role 1, Admin Role 2 và Staff Role 3)
            var users = await _context.Users
                .Include(u => u.UserLocations)
                .Include(u => u.Attendances).ThenInclude(a => a.Schedule)
                .Where(u => (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3) && !u.IsDeleted)
                .ToListAsync();

            // Lọc ra các nhân sự thuộc chi nhánh hoặc có chấm công/lịch trực tại chi nhánh này
            users = users.Where(u => 
                u.UserLocations.Any(ul => ul.LocationId == locationId) || 
                u.Attendances.Any(a => a.LocationId == locationId)
            ).ToList();

            var payrolls = new List<object>();

            foreach (var user in users)
            {
                var userLoc = user.UserLocations.FirstOrDefault(ul => ul.LocationId == locationId);
                decimal hourlyWage = userLoc?.HourlyWage ?? 25000;

                // Lọc danh sách chấm công trong khoảng thời gian (cả đã checkout và đang làm việc để phạt đi trễ trừ liền)
                var userAtts = user.Attendances
                    .Where(a => a.CheckInTime.Date >= start && a.CheckInTime.Date <= end && a.LocationId == locationId)
                    .ToList();

                double totalHours = 0;
                decimal baseSalary = 0;
                decimal penalty = 0;
                decimal bonus = 0;

                foreach (var att in userAtts)
                {
                    if (att.Schedule != null)
                    {
                        var baseDate = att.Schedule.Date.Date;
                        var schedStart = DateTime.SpecifyKind(baseDate.Add(att.Schedule.StartTime), att.CheckInTime.Kind);
                        var schedEnd = DateTime.SpecifyKind(baseDate.Add(att.Schedule.EndTime), att.CheckInTime.Kind);
                        if (att.Schedule.EndTime < att.Schedule.StartTime)
                        {
                            schedEnd = schedEnd.AddDays(1);
                        }

                        if (att.CheckOutTime != null)
                        {
                            // Giờ làm tối đa tính theo ca trực chính thức (No OT)
                            var checkOutLimit = att.CheckOutTime.Value > schedEnd ? schedEnd : att.CheckOutTime.Value;
                            var hours = (checkOutLimit - att.CheckInTime).TotalHours;
                            if (hours < 0) hours = 0;

                            // Bỏ qua ca làm dưới 30 phút (0.5 giờ) — không tính lương
                            if (hours < 0.5) continue;

                            totalHours += hours;

                            // Lương theo hệ số lễ hoặc thường
                            var attDateStr = att.CheckInTime.ToString("yyyy-MM-dd");
                            var schedDateStr = att.Schedule.Date.ToString("yyyy-MM-dd");
                            HolidayDetail? holiday = null;
                            if (holidayMap.ContainsKey(attDateStr)) holiday = holidayMap[attDateStr];
                            else if (holidayMap.ContainsKey(schedDateStr)) holiday = holidayMap[schedDateStr];

                            if (holiday != null)
                            {
                                double mult = holiday.Multiplier > 0 ? holiday.Multiplier : 1.0;
                                baseSalary += (decimal)hours * hourlyWage;
                                bonus += (decimal)hours * hourlyWage * (decimal)(mult - 1.0) + holiday.FlatBonus;
                            }
                            else
                            {
                                baseSalary += (decimal)hours * hourlyWage;
                            }
                        }

                        // Tính đi trễ theo công thức lũy tiến mới (trừ liền khi có check-in)
                        if (att.CheckInTime > schedStart)
                        {
                            var lateMin = (att.CheckInTime - schedStart).TotalMinutes;
                            var latePenaltyAmt = CalculateLatePenalty(lateMin, startMins, baseAmt, intervalMins, multiplier, maxAmt);
                            
                            string autoRef = $"LATE_{user.Id}_{att.Schedule.Date:yyyy-MM-dd}_{att.Schedule.StartTime.ToString(@"hh\:mm")}";
                            bool isOverridden = adjustmentsList.Any(a => a.AutoRef == autoRef);

                            if (!isOverridden)
                            {
                                penalty += latePenaltyAmt;
                            }
                        }
                    }
                }

                // Cộng/Trừ các khoản Adjustments riêng cho từng nhân viên
                var userAdjustments = adjustmentsList
                    .Where(a => a.EmployeeId == user.Id)
                    .ToList();

                decimal advance = 0;
                foreach (var adj in userAdjustments)
                {
                    if (DateTime.TryParse(adj.Date, out DateTime adjDate))
                    {
                        if (adjDate.Date >= start && adjDate.Date <= end)
                        {
                            decimal amount = adj.Amount > 0 ? adj.Amount : (decimal)adj.Quantity * adj.AmountPerUnit;
                            if (adj.Type == "bonus")
                            {
                                bonus += amount;
                            }
                            else if (adj.Type == "penalty")
                            {
                                penalty += amount;
                            }
                            else if (adj.Type == "advance")
                            {
                                advance += amount;
                            }
                        }
                    }
                }

                // Tính các loại thưởng và phạt động khác từ database configs (Bonus_ / Penalty_ nếu có)
                foreach (var config in configs)
                {
                    // Thưởng động khác (Bonus_)
                    if (config.ConfigKey.StartsWith("Bonus_"))
                    {
                        var valStr = config.ConfigValue;
                        if (valStr.StartsWith("per_shift:"))
                        {
                            if (decimal.TryParse(valStr.Substring(10), out decimal val))
                            {
                                bonus += val * userAtts.Count;
                            }
                        }
                        else
                        {
                            if (decimal.TryParse(valStr, out decimal val))
                            {
                                bonus += val;
                            }
                        }
                    }
                    // Phạt động khác (Penalty_)
                    else if (config.ConfigKey.StartsWith("Penalty_"))
                    {
                        var valStr = config.ConfigValue;
                        if (valStr.StartsWith("per_shift:"))
                        {
                            if (decimal.TryParse(valStr.Substring(10), out decimal val))
                            {
                                penalty += val * userAtts.Count;
                            }
                        }
                        else
                        {
                            if (decimal.TryParse(valStr, out decimal val))
                            {
                                penalty += val;
                            }
                        }
                    }
                }

                // Tổng cộng lương
                decimal finalAmount = baseSalary + bonus - penalty - advance;

                var detailsList = new List<object>();
                foreach (var a in userAtts)
                {
                    if (a.Schedule != null)
                    {
                        var baseDate = a.Schedule.Date.Date;
                        var schedEnd = baseDate.Add(a.Schedule.EndTime);
                        if (a.Schedule.EndTime < a.Schedule.StartTime) schedEnd = schedEnd.AddDays(1);
                        var checkOutLimit = a.CheckOutTime != null ? (a.CheckOutTime.Value > schedEnd ? schedEnd : a.CheckOutTime.Value) : DateTime.MinValue;
                        var hrs = a.CheckOutTime != null ? (checkOutLimit - a.CheckInTime).TotalHours : 0;
                        if (hrs < 0) hrs = 0;

                        detailsList.Add(new {
                            attId = a.Id,
                            checkIn = a.CheckInTime.ToString("yyyy-MM-dd HH:mm:ss"),
                            checkOut = a.CheckOutTime?.ToString("yyyy-MM-dd HH:mm:ss"),
                            schedEnd = schedEnd.ToString("yyyy-MM-dd HH:mm:ss"),
                            checkOutLimit = checkOutLimit.ToString("yyyy-MM-dd HH:mm:ss"),
                            hours = Math.Round(hrs, 5)
                        });
                    }
                }

                payrolls.Add(new
                {
                    userId = user.Id,
                    fullName = user.FullName,
                    phoneNumber = user.PhoneNumber,
                    hourlyWage,
                    totalWorkedHours = Math.Round(totalHours, 1),
                    baseSalary = Math.Round(baseSalary),
                    totalBonus = Math.Round(bonus),
                    totalPenalty = Math.Round(penalty),
                    totalAdvance = Math.Round(advance),
                    finalAmount = Math.Round(finalAmount),
                    details = detailsList
                });
            }

            return Ok(payrolls);
        }

        // 11. Xuất báo cáo bảng lương ra định dạng Excel (.xlsx)
        [HttpGet("payroll/export")]
        public async Task<IActionResult> ExportPayroll([FromQuery] string locationId, [FromQuery] string fromDate, [FromQuery] string toDate)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";
            var start = DateTime.Parse(fromDate).Date;
            var end = DateTime.Parse(toDate).Date;

            // Load configs
            var configs = await _context.PayrollConfigs.Where(c => c.LocationId == locationId && c.IsActive).ToListAsync();
            
            var startMinsConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyStartMinutes")?.ConfigValue;
            var baseAmtConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyBaseAmount")?.ConfigValue;
            var intervalMinsConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyIntervalMinutes")?.ConfigValue;
            var multiplierConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyMultiplier")?.ConfigValue;
            var maxAmtConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyMaxAmount")?.ConfigValue;

            int startMins = 10;
            decimal baseAmt = 50000;
            int intervalMins = 10;
            double multiplier = 2;
            decimal maxAmt = 500000;

            if (int.TryParse(startMinsConfig, out int parsedStart)) startMins = parsedStart;
            if (decimal.TryParse(baseAmtConfig, out decimal parsedBase)) baseAmt = parsedBase;
            if (int.TryParse(intervalMinsConfig, out int parsedInterval)) intervalMins = parsedInterval;
            if (double.TryParse(multiplierConfig, out double parsedMultiplier)) multiplier = parsedMultiplier;
            if (decimal.TryParse(maxAmtConfig, out decimal parsedMax)) maxAmt = parsedMax;

            // Parse Holidays_Detailed
            var holidaysDetailedStr = configs.FirstOrDefault(c => c.ConfigKey == "Holidays_Detailed")?.ConfigValue;
            var holidayMap = new Dictionary<string, HolidayDetail>(StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrEmpty(holidaysDetailedStr))
            {
                try
                {
                    var detailedList = JsonSerializer.Deserialize<List<HolidayDetail>>(holidaysDetailedStr);
                    if (detailedList != null)
                    {
                        foreach (var h in detailedList)
                        {
                            if (DateTime.TryParse(h.Date, out DateTime hDate))
                            {
                                var dateKey = hDate.ToString("yyyy-MM-dd");
                                holidayMap[dateKey] = h;
                            }
                        }
                    }
                }
                catch { }
            }

            var adjustmentsStr = configs.FirstOrDefault(c => c.ConfigKey == "Adjustments")?.ConfigValue;
            var adjustmentsList = new List<PayrollAdjustment>();
            if (!string.IsNullOrEmpty(adjustmentsStr))
            {
                try
                {
                    adjustmentsList = JsonSerializer.Deserialize<List<PayrollAdjustment>>(adjustmentsStr) ?? new List<PayrollAdjustment>();
                }
                catch { }
            }

            var activeBonusStr = configs.FirstOrDefault(c => c.ConfigKey == "ActiveBonus")?.ConfigValue ?? "100000";
            decimal defaultShiftBonus = 0;
            decimal.TryParse(activeBonusStr, out defaultShiftBonus);

            var users = await _context.Users
                .Include(u => u.UserLocations)
                .Include(u => u.Attendances).ThenInclude(a => a.Schedule)
                .Where(u => (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3) && !u.IsDeleted)
                .ToListAsync();

            users = users.Where(u => 
                u.UserLocations.Any(ul => ul.LocationId == locationId) || 
                u.Attendances.Any(a => a.LocationId == locationId)
            ).ToList();

            using var workbook = new ClosedXML.Excel.XLWorkbook();
            var ws = workbook.Worksheets.Add("Bang Luong Chi Nhanh");

            // Header row
            ws.Cell(1, 1).Value = "Họ tên";
            ws.Cell(1, 2).Value = "Số điện thoại";
            ws.Cell(1, 3).Value = "Lương/giờ";
            ws.Cell(1, 4).Value = "Tổng giờ làm";
            ws.Cell(1, 5).Value = "Lương cơ bản";
            ws.Cell(1, 6).Value = "Thưởng";
            ws.Cell(1, 7).Value = "Phạt đi trễ";
            ws.Cell(1, 8).Value = "Tạm ứng";
            ws.Cell(1, 9).Value = "Lương thực nhận";

            var headerRange = ws.Range(1, 1, 1, 9);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#7c4831");
            headerRange.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
            headerRange.Style.Alignment.Horizontal = ClosedXML.Excel.XLAlignmentHorizontalValues.Center;

            int rowIdx = 2;
            foreach (var user in users)
            {
                var userLoc = user.UserLocations.FirstOrDefault(ul => ul.LocationId == locationId);
                decimal hourlyWage = userLoc?.HourlyWage ?? 25000;

                var userAtts = user.Attendances
                    .Where(a => a.CheckInTime.Date >= start && a.CheckInTime.Date <= end && a.LocationId == locationId)
                    .ToList();

                double totalHours = 0;
                decimal baseSalary = 0;
                decimal penalty = 0;
                decimal bonus = 0;

                foreach (var att in userAtts)
                {
                    if (att.Schedule != null)
                    {
                        var baseDate = att.Schedule.Date.Date;
                        var schedStart = DateTime.SpecifyKind(baseDate.Add(att.Schedule.StartTime), att.CheckInTime.Kind);
                        var schedEnd = DateTime.SpecifyKind(baseDate.Add(att.Schedule.EndTime), att.CheckInTime.Kind);
                        if (att.Schedule.EndTime < att.Schedule.StartTime)
                        {
                            schedEnd = schedEnd.AddDays(1);
                        }

                        if (att.CheckOutTime != null)
                        {
                            var checkOutLimit = att.CheckOutTime.Value > schedEnd ? schedEnd : att.CheckOutTime.Value;
                            var hours = (checkOutLimit - att.CheckInTime).TotalHours;
                            if (hours < 0) hours = 0;

                            // Bỏ qua ca làm dưới 30 phút (0.5 giờ) — không tính lương
                            if (hours < 0.5) continue;

                            totalHours += hours;

                            // Lương theo hệ số lễ hoặc thường
                            var attDateStr = att.CheckInTime.ToString("yyyy-MM-dd");
                            var schedDateStr = att.Schedule.Date.ToString("yyyy-MM-dd");
                            HolidayDetail? holiday = null;
                            if (holidayMap.ContainsKey(attDateStr)) holiday = holidayMap[attDateStr];
                            else if (holidayMap.ContainsKey(schedDateStr)) holiday = holidayMap[schedDateStr];

                            if (holiday != null)
                            {
                                double mult = holiday.Multiplier > 0 ? holiday.Multiplier : 1.0;
                                baseSalary += (decimal)hours * hourlyWage;
                                bonus += (decimal)hours * hourlyWage * (decimal)(mult - 1.0) + holiday.FlatBonus;
                            }
                            else
                            {
                                baseSalary += (decimal)hours * hourlyWage;
                            }
                        }

                        if (att.CheckInTime > schedStart)
                        {
                            var lateMin = (att.CheckInTime - schedStart).TotalMinutes;
                            var latePenaltyAmt = CalculateLatePenalty(lateMin, startMins, baseAmt, intervalMins, multiplier, maxAmt);
                            
                            string autoRef = $"LATE_{user.Id}_{att.Schedule.Date:yyyy-MM-dd}_{att.Schedule.StartTime.ToString(@"hh\:mm")}";
                            bool isOverridden = adjustmentsList.Any(a => a.AutoRef == autoRef);

                            if (!isOverridden)
                            {
                                penalty += latePenaltyAmt;
                            }
                        }
                    }
                }

                var userAdjustments = adjustmentsList
                    .Where(a => a.EmployeeId == user.Id)
                    .ToList();

                decimal advance = 0;
                foreach (var adj in userAdjustments)
                {
                    if (DateTime.TryParse(adj.Date, out DateTime adjDate))
                    {
                        if (adjDate.Date >= start && adjDate.Date <= end)
                        {
                            decimal amount = adj.Amount > 0 ? adj.Amount : (decimal)adj.Quantity * adj.AmountPerUnit;
                            if (adj.Type == "bonus") bonus += amount;
                            else if (adj.Type == "penalty") penalty += amount;
                            else if (adj.Type == "advance") advance += amount;
                        }
                    }
                }

                foreach (var config in configs)
                {
                    if (config.ConfigKey.StartsWith("Bonus_"))
                    {
                        var valStr = config.ConfigValue;
                        if (valStr.StartsWith("per_shift:"))
                        {
                            if (decimal.TryParse(valStr.Substring(10), out decimal val)) bonus += val * userAtts.Count;
                        }
                        else
                        {
                            if (decimal.TryParse(valStr, out decimal val)) bonus += val;
                        }
                    }
                    else if (config.ConfigKey.StartsWith("Penalty_"))
                    {
                        var valStr = config.ConfigValue;
                        if (valStr.StartsWith("per_shift:"))
                        {
                            if (decimal.TryParse(valStr.Substring(10), out decimal val)) penalty += val * userAtts.Count;
                        }
                        else
                        {
                            if (decimal.TryParse(valStr, out decimal val)) penalty += val;
                        }
                    }
                }

                decimal finalAmount = baseSalary + bonus - penalty - advance;

                ws.Cell(rowIdx, 1).Value = user.FullName;
                ws.Cell(rowIdx, 2).Value = user.PhoneNumber;
                ws.Cell(rowIdx, 3).Value = hourlyWage;
                ws.Cell(rowIdx, 4).Value = Math.Round(totalHours, 1);
                ws.Cell(rowIdx, 5).Value = Math.Round(baseSalary);
                ws.Cell(rowIdx, 6).Value = Math.Round(bonus);
                ws.Cell(rowIdx, 7).Value = Math.Round(penalty);
                ws.Cell(rowIdx, 8).Value = Math.Round(advance);
                ws.Cell(rowIdx, 9).Value = Math.Round(finalAmount);

                rowIdx++;
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"BangLuong_{locationId}_{fromDate}_to_{toDate}.xlsx"
            );
        }


        // Helper: Tính khoảng cách GPS dựa trên Haversine
        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3; // bán kính Trái Đất (mét)
            var phi1 = lat1 * Math.PI / 180;
            var phi2 = lat2 * Math.PI / 180;
            var deltaPhi = (lat2 - lat1) * Math.PI / 180;
            var deltaLambda = (lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(deltaPhi / 2) * Math.Sin(deltaPhi / 2) +
                    Math.Cos(phi1) * Math.Cos(phi2) *
                    Math.Sin(deltaLambda / 2) * Math.Sin(deltaLambda / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c; // Khoảng cách tính bằng mét
        }

        // Helper: Phân tích mốc phạt đi trễ theo hệ số
        private List<(double minutes, decimal coefficient)> ParsePenaltyRules(string ruleStr)
        {
            var list = new List<(double minutes, decimal coefficient)>();
            try
            {
                var parts = ruleStr.Split(',');
                foreach (var p in parts)
                {
                    var split = p.Split(':');
                    if (split.Length == 2)
                    {
                        list.Add((double.Parse(split[0]), Math.Abs(decimal.Parse(split[1]))));
                    }
                }
            }
            catch
            {
                // Fallback default (trễ 10 phút phạt 0.5 giờ lương, trễ 20 phút phạt 1.0 giờ lương, trễ 30 phút phạt 2.0 giờ lương)
                list.Add((10, 0.5m));
                list.Add((20, 1.0m));
                list.Add((30, 2.0m));
            }
            return list.OrderByDescending(x => x.minutes).ToList();
        }

        // Helper: Tính toán hệ số phạt đi trễ dựa trên số phút trễ
        private decimal CalculatePenaltyCoefficient(double lateMinutes, List<(double minutes, decimal coefficient)> rules)
        {
            foreach (var rule in rules)
            {
                if (lateMinutes >= rule.minutes)
                {
                    return rule.coefficient;
                }
            }
            return 0;
        }

        // Helper: Tính số tiền phạt đi trễ lũy tiến theo công thức nhân hệ số
        private decimal CalculateLatePenalty(double lateMinutes, int startMins, decimal baseAmt, int intervalMins, double multiplier, decimal maxAmt)
        {
            if (lateMinutes < startMins) return 0;
            double intervals = Math.Floor((lateMinutes - startMins) / intervalMins);
            double multiplierFactor = Math.Pow(multiplier, intervals);
            decimal penalty = baseAmt * (decimal)multiplierFactor;
            if (maxAmt > 0 && penalty > maxAmt) return maxAmt;
            return penalty;
        }

        // 11. Yêu cầu của nhân viên (Requests)
        [HttpGet("requests")]
        public async Task<IActionResult> GetRequests([FromQuery] string locationId, [FromQuery] string? userId = null)
        {
            if (string.IsNullOrEmpty(locationId)) locationId = "govap-branch";

            var query = _context.StaffRequests
                .Include(r => r.User)
                .Where(r => r.LocationId == locationId);

            if (!string.IsNullOrEmpty(userId))
            {
                query = query.Where(r => r.UserId == userId);
            }

            var list = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.UserId,
                    staffName = r.User != null ? r.User.FullName : "Nhân viên",
                    r.Type,
                    r.Details,
                    r.Date,
                    r.Status,
                    r.TargetShiftId,
                    r.SwapWithStaffName,
                    r.SwapWithStaffId,
                    r.SwapWithShiftId,
                    createdAt = r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost("requests")]
        public async Task<IActionResult> CreateRequest([FromBody] RequestCreateDto dto)
        {
            var request = new StaffRequest
            {
                UserId = dto.UserId,
                LocationId = dto.LocationId,
                Type = dto.Type,
                Details = dto.Details,
                Date = dto.Date,
                Status = "pending",
                TargetShiftId = dto.TargetShiftId,
                SwapWithStaffName = dto.SwapWithStaffName,
                SwapWithStaffId = dto.SwapWithStaffId,
                SwapWithShiftId = dto.SwapWithShiftId,
                OriginalStartTime = dto.OriginalStartTime != null ? TimeSpan.Parse(dto.OriginalStartTime) : null,
                RequestedStartTime = dto.RequestedStartTime != null ? TimeSpan.Parse(dto.RequestedStartTime) : null,
                RequestedEndTime = dto.RequestedEndTime != null ? TimeSpan.Parse(dto.RequestedEndTime) : null,
                ExtensionDurationMinutes = dto.ExtensionDurationMinutes
            };

            _context.StaffRequests.Add(request);
            await _context.SaveChangesAsync();

            // Notifications logic
            try
            {
                var initiator = await _context.Users.FindAsync(dto.UserId);
                if (dto.Type == "swap")
                {
                    // 1. Notify target staff
                    if (!string.IsNullOrEmpty(dto.SwapWithStaffId))
                    {
                        var targetUser = await _context.Users.FindAsync(dto.SwapWithStaffId);
                        if (targetUser != null && initiator != null)
                        {
                            var targetNotif = new Notification
                            {
                                UserId = dto.SwapWithStaffId,
                                Title = "Yêu cầu đổi ca trực",
                                Message = $"Bạn nhận được yêu cầu đổi ca trực từ {initiator.FullName} cho ca ngày {dto.Date}. Vui lòng chờ quản lý phê duyệt."
                            };
                            _context.Notifications.Add(targetNotif);
                            
                            // Send Web Push
                            await SendPushNotification(dto.SwapWithStaffId, targetNotif.Title, targetNotif.Message);
                        }
                    }

                    // 2. Notify branch admins
                    var branchAdmins = await _context.UserLocations
                        .Include(ul => ul.User)
                        .Where(ul => ul.LocationId == dto.LocationId && (ul.User!.RoleId == 1 || ul.User!.RoleId == 2))
                        .Select(ul => ul.UserId)
                        .ToListAsync();

                    foreach (var adminId in branchAdmins)
                    {
                        var adminNotif = new Notification
                        {
                            UserId = adminId,
                            Title = "Yêu cầu đổi ca trực mới",
                            Message = $"{initiator?.FullName} đã gửi yêu cầu đổi ca trực với {dto.SwapWithStaffName} ngày {dto.Date}."
                        };
                        _context.Notifications.Add(adminNotif);
                        
                        // Send Web Push
                        await SendPushNotification(adminId, adminNotif.Title, adminNotif.Message);
                    }
                }
                else if (dto.Type == "leave")
                {
                    // Notify branch admins
                    var branchAdmins = await _context.UserLocations
                        .Include(ul => ul.User)
                        .Where(ul => ul.LocationId == dto.LocationId && (ul.User!.RoleId == 1 || ul.User!.RoleId == 2))
                        .Select(ul => ul.UserId)
                        .ToListAsync();

                    foreach (var adminId in branchAdmins)
                    {
                        var adminNotif = new Notification
                        {
                            UserId = adminId,
                            Title = "Đơn xin nghỉ phép mới",
                            Message = $"{initiator?.FullName} đã gửi đơn xin nghỉ ca trực ngày {dto.Date}."
                        };
                        _context.Notifications.Add(adminNotif);
                        
                        // Send Web Push
                        await SendPushNotification(adminId, adminNotif.Title, adminNotif.Message);
                    }
                }
                else if (dto.Type == "extension")
                {
                    // Notify target staff (Staff A)
                    if (!string.IsNullOrEmpty(dto.SwapWithStaffId))
                    {
                        var targetUser = await _context.Users.FindAsync(dto.SwapWithStaffId);
                        if (targetUser != null && initiator != null)
                        {
                            var targetNotif = new Notification
                            {
                                UserId = dto.SwapWithStaffId,
                                Title = "Yêu cầu kéo ca trực",
                                Message = $"Bạn nhận được yêu cầu kéo ca từ {initiator.FullName} cho ca ngày {dto.Date}. Vui lòng xác nhận."
                            };
                            _context.Notifications.Add(targetNotif);
                            await SendPushNotification(dto.SwapWithStaffId, targetNotif.Title, targetNotif.Message);
                        }
                    }
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error creating notifications: " + ex.Message);
            }

            return Ok(new { message = "Gửi đơn yêu cầu thành công!", requestId = request.Id });
        }

        [HttpPost("requests/{id}/approve")]
        public async Task<IActionResult> ApproveRequest(string id)
        {
            var request = await _context.StaffRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                return NotFound(new { message = "Yêu cầu không tồn tại!" });
            }

            request.Status = "approved";

            // Nếu là đơn xin nghỉ và có ID ca trực, tự động xóa ca trực đó khỏi lịch và ca rảnh tương ứng
            if (request.Type == "leave" && !string.IsNullOrEmpty(request.TargetShiftId))
            {
                var schedule = await _context.OfficialSchedules.FindAsync(request.TargetShiftId);
                if (schedule != null)
                {
                    var avails = await _context.StaffAvailabilities
                        .Where(sa => sa.UserId == schedule.UserId && sa.Date == schedule.Date)
                        .ToListAsync();
                    
                    var overlappingAvails = avails.Where(sa => 
                        (sa.StartTime < schedule.EndTime && sa.EndTime > schedule.StartTime) ||
                        (schedule.EndTime < schedule.StartTime && (sa.StartTime < schedule.EndTime.Add(TimeSpan.FromDays(1)) || sa.EndTime > schedule.StartTime))
                    ).ToList();

                    if (overlappingAvails.Any())
                    {
                        _context.StaffAvailabilities.RemoveRange(overlappingAvails);
                    }

                    // _context.OfficialSchedules.Remove(schedule); // Keep schedule to show absent status

                    // Notify initiator
                    var initiatorNotif = new Notification
                    {
                        UserId = request.UserId,
                        Title = "Đơn xin nghỉ phép đã được duyệt",
                        Message = $"Đơn xin nghỉ ca trực ngày {request.Date} của bạn đã được quản lý phê duyệt."
                    };
                    _context.Notifications.Add(initiatorNotif);
                    
                    // Send Web Push
                    await SendPushNotification(request.UserId, initiatorNotif.Title, initiatorNotif.Message);
                }
            }
            // Nếu là đơn đổi ca trực và có cả 2 shift IDs
            else if (request.Type == "swap" && !string.IsNullOrEmpty(request.TargetShiftId) && !string.IsNullOrEmpty(request.SwapWithShiftId))
            {
                var initSchedule = await _context.OfficialSchedules.FindAsync(request.TargetShiftId);
                var targetSchedule = await _context.OfficialSchedules.FindAsync(request.SwapWithShiftId);

                if (initSchedule != null && targetSchedule != null)
                {
                    // Swap user assignments
                    var tempUserId = initSchedule.UserId;
                    initSchedule.UserId = targetSchedule.UserId;
                    targetSchedule.UserId = tempUserId;

                    // Notify both users
                    var userA = await _context.Users.FindAsync(request.UserId);
                    var userB = await _context.Users.FindAsync(request.SwapWithStaffId);

                    var notifA = new Notification
                    {
                        UserId = request.UserId,
                        Title = "Đổi ca trực thành công",
                        Message = $"Yêu cầu đổi ca trực của bạn với {userB?.FullName} ngày {request.Date} đã được quản lý phê duyệt."
                    };
                    var notifB = new Notification
                    {
                        UserId = request.SwapWithStaffId ?? string.Empty,
                        Title = "Đổi ca trực thành công",
                        Message = $"Yêu cầu đổi ca trực giữa bạn và {userA?.FullName} ngày {request.Date} đã được quản lý phê duyệt."
                    };

                    _context.Notifications.Add(notifA);
                    await SendPushNotification(request.UserId, notifA.Title, notifA.Message);
                    
                    if (!string.IsNullOrEmpty(request.SwapWithStaffId))
                    {
                        _context.Notifications.Add(notifB);
                        await SendPushNotification(request.SwapWithStaffId, notifB.Title, notifB.Message);
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Phê duyệt đơn thành công!" });
        }

        [HttpPost("requests/{id}/reject")]
        public async Task<IActionResult> RejectRequest(string id)
        {
            var request = await _context.StaffRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Yêu cầu không tồn tại!" });
            }

            request.Status = "rejected";

            try
            {
                // Notify initiator
                var initiatorNotif = new Notification
                {
                    UserId = request.UserId,
                    Title = "Đơn yêu cầu bị từ chối",
                    Message = $"Đơn yêu cầu {(request.Type == "swap" ? "đổi ca trực" : "nghỉ phép")} ngày {request.Date} của bạn đã bị quản lý từ chối."
                };
                _context.Notifications.Add(initiatorNotif);
                await SendPushNotification(request.UserId, initiatorNotif.Title, initiatorNotif.Message);

                // If swap, notify target too
                if (request.Type == "swap" && !string.IsNullOrEmpty(request.SwapWithStaffId))
                {
                    var targetNotif = new Notification
                    {
                        UserId = request.SwapWithStaffId,
                        Title = "Yêu cầu đổi ca trực bị từ chối",
                        Message = $"Yêu cầu đổi ca trực ngày {request.Date} liên quan đến bạn đã bị quản lý từ chối."
                    };
                    _context.Notifications.Add(targetNotif);
                    await SendPushNotification(request.SwapWithStaffId, targetNotif.Title, targetNotif.Message);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error sending reject notifications: " + ex.Message);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Từ chối đơn thành công!" });
        }

        [HttpPost("requests/{id}/accept-extension")]
        public async Task<IActionResult> AcceptExtension(string id)
        {
            var request = await _context.StaffRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null || request.Type != "extension")
            {
                return NotFound(new { message = "Yêu cầu kéo ca không tồn tại!" });
            }

            if (request.Status != "pending")
            {
                return BadRequest(new { message = "Yêu cầu này đã được xử lý!" });
            }

            // Check if target shift exists (Staff A's shift that is being extended)
            var targetShift = await _context.OfficialSchedules.FindAsync(request.SwapWithShiftId);
            if (targetShift == null)
            {
                return NotFound(new { message = "Ca trực của người nhận không tồn tại!" });
            }

            // Check if requester shift exists (Staff B's shift that is being delayed)
            var requesterShift = await _context.OfficialSchedules.FindAsync(request.TargetShiftId);
            if (requesterShift == null)
            {
                return NotFound(new { message = "Ca trực của người yêu cầu không tồn tại!" });
            }

            // Check branch isolation
            var requesterLocations = await _context.UserLocations.Where(ul => ul.UserId == request.UserId).Select(ul => ul.LocationId).ToListAsync();
            var targetLocations = await _context.UserLocations.Where(ul => ul.UserId == request.SwapWithStaffId).Select(ul => ul.LocationId).ToListAsync();
            
            if (!requesterLocations.Intersect(targetLocations).Any())
            {
                return BadRequest(new { message = "Không thể kéo ca với nhân viên khác chi nhánh!" });
            }

            // Update Status
            request.Status = "approved";

            // Update target shift (Staff A - extends end time)
            if (targetShift.OriginalStartTime == null) targetShift.OriginalStartTime = targetShift.StartTime;
            if (targetShift.OriginalEndTime == null) targetShift.OriginalEndTime = targetShift.EndTime;
            
            // Update requester shift (Staff B - delays start time)
            if (requesterShift.OriginalStartTime == null) requesterShift.OriginalStartTime = requesterShift.StartTime;
            if (requesterShift.OriginalEndTime == null) requesterShift.OriginalEndTime = requesterShift.EndTime;

            if (request.ExtensionDurationMinutes.HasValue)
            {
                targetShift.ExtensionDurationMinutes += request.ExtensionDurationMinutes.Value;
                targetShift.EndTime = targetShift.EndTime.Add(TimeSpan.FromMinutes(request.ExtensionDurationMinutes.Value));
                requesterShift.StartTime = requesterShift.StartTime.Add(TimeSpan.FromMinutes(request.ExtensionDurationMinutes.Value));
            }

            if (request.RequestedEndTime.HasValue)
            {
                targetShift.EndTime = request.RequestedEndTime.Value;
            }
            if (request.RequestedStartTime.HasValue)
            {
                requesterShift.StartTime = request.RequestedStartTime.Value;
            }

            try
            {
                var initiatorNotif = new Notification
                {
                    UserId = request.UserId,
                    Title = "Yêu cầu kéo ca đã được chấp nhận",
                    Message = $"Nhân viên {request.SwapWithStaffName} đã đồng ý kéo ca ngày {request.Date}."
                };
                _context.Notifications.Add(initiatorNotif);
                await SendPushNotification(request.UserId, initiatorNotif.Title, initiatorNotif.Message);

                // Notify branch admins
                var branchAdmins = await _context.UserLocations
                    .Include(ul => ul.User)
                    .Where(ul => ul.LocationId == request.LocationId && (ul.User!.RoleId == 1 || ul.User!.RoleId == 2))
                    .Select(ul => ul.UserId)
                    .ToListAsync();

                foreach (var adminId in branchAdmins)
                {
                    var adminNotif = new Notification
                    {
                        UserId = adminId,
                        Title = "Thông báo kéo ca trực",
                        Message = $"Nhân viên {request.SwapWithStaffName} đã đồng ý kéo ca cho {request.User?.FullName} ngày {request.Date}."
                    };
                    _context.Notifications.Add(adminNotif);
                    await SendPushNotification(adminId, adminNotif.Title, adminNotif.Message);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error sending notifications: " + ex.Message);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã chấp nhận kéo ca thành công!" });
        }

        [HttpPost("requests/{id}/reject-extension")]
        public async Task<IActionResult> RejectExtension(string id)
        {
            var request = await _context.StaffRequests.FindAsync(id);
            if (request == null || request.Type != "extension")
            {
                return NotFound(new { message = "Yêu cầu kéo ca không tồn tại!" });
            }

            if (request.Status != "pending")
            {
                return BadRequest(new { message = "Yêu cầu này đã được xử lý!" });
            }

            request.Status = "rejected";

            try
            {
                var initiatorNotif = new Notification
                {
                    UserId = request.UserId,
                    Title = "Yêu cầu kéo ca bị từ chối",
                    Message = $"Nhân viên {request.SwapWithStaffName} đã từ chối yêu cầu kéo ca ngày {request.Date} của bạn."
                };
                _context.Notifications.Add(initiatorNotif);
                await SendPushNotification(request.UserId, initiatorNotif.Title, initiatorNotif.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error sending notifications: " + ex.Message);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã từ chối kéo ca!" });
        }

        // DTOs
        public class PayrollAdjustment
        {
            public string EmployeeId { get; set; } = string.Empty;
            public string EmployeeName { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty; // "bonus" hoặc "penalty"
            public string Unit { get; set; } = string.Empty; // "lan", "phut", "co_dinh"
            public double Quantity { get; set; } = 1;
            public decimal AmountPerUnit { get; set; }
            public decimal Amount { get; set; }
            public string Date { get; set; } = string.Empty; // "YYYY-MM-DD"
            public string Note { get; set; } = string.Empty;
            public string? AutoRef { get; set; }
        }

        public class HolidayDetail
        {
            public string Date { get; set; } = string.Empty; // "YYYY-MM-DD"
            public string Note { get; set; } = string.Empty;
            public double Multiplier { get; set; } = 2.0;
            public decimal FlatBonus { get; set; } = 0;
        }

        public class ConfigUpdateDto
        {
            public string ConfigKey { get; set; } = string.Empty;
            public string ConfigValue { get; set; } = string.Empty;
            public string? Description { get; set; }
        }

        public class AvailabilityRegisterDto
        {
            public string UserId { get; set; } = string.Empty;
            public string LocationId { get; set; } = string.Empty;
            public string Date { get; set; } = string.Empty;
            public string StartTime { get; set; } = string.Empty;
            public string EndTime { get; set; } = string.Empty;
        }

        public class ScheduleCreateDto
        {
            public string UserId { get; set; } = string.Empty;
            public string LocationId { get; set; } = string.Empty;
            public string Date { get; set; } = string.Empty;
            public string StartTime { get; set; } = string.Empty;
            public string EndTime { get; set; } = string.Empty;
            public string? CreatedBy { get; set; }
        }

        public class ClockInDto
        {
            public string UserId { get; set; } = string.Empty;
            public string LocationId { get; set; } = string.Empty;
            public double Lat { get; set; }
            public double Lng { get; set; }
        }

        public class ClockOutDto
        {
            public string UserId { get; set; } = string.Empty;
            public string LocationId { get; set; } = string.Empty;
        }

        public class RequestCreateDto
        {
            public string UserId { get; set; } = string.Empty;
            public string LocationId { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty; // "leave" | "swap" | "extension"
            public string Details { get; set; } = string.Empty;
            public string Date { get; set; } = string.Empty; // YYYY-MM-DD
            public string? TargetShiftId { get; set; }
            public string? SwapWithStaffName { get; set; }
            public string? SwapWithStaffId { get; set; }
            public string? SwapWithShiftId { get; set; }
            public string? OriginalStartTime { get; set; }
            public string? RequestedStartTime { get; set; }
            public string? RequestedEndTime { get; set; }
            public int? ExtensionDurationMinutes { get; set; }
        }

        // 12. Chốt lương (Lưu bảng lương vào DB)
        [HttpPost("payroll/save")]
        public async Task<IActionResult> SavePayroll([FromBody] SavePayrollDto dto)
        {
            if (string.IsNullOrEmpty(dto.LocationId)) return BadRequest("locationId is required");
            var start = DateTime.Parse(dto.FromDate).Date;
            var end = DateTime.Parse(dto.ToDate).Date;

            // Load configs (same logic as GetPayroll)
            var configs = await _context.PayrollConfigs.Where(c => c.LocationId == dto.LocationId && c.IsActive).ToListAsync();

            var startMinsConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyStartMinutes")?.ConfigValue;
            var baseAmtConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyBaseAmount")?.ConfigValue;
            var intervalMinsConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyIntervalMinutes")?.ConfigValue;
            var multiplierConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyMultiplier")?.ConfigValue;
            var maxAmtConfig = configs.FirstOrDefault(c => c.ConfigKey == "LatePenaltyMaxAmount")?.ConfigValue;

            int startMins = 10;
            decimal baseAmt = 50000;
            int intervalMins = 10;
            double multiplier = 2;
            decimal maxAmt = 500000;

            if (int.TryParse(startMinsConfig, out int parsedStart)) startMins = parsedStart;
            if (decimal.TryParse(baseAmtConfig, out decimal parsedBase)) baseAmt = parsedBase;
            if (int.TryParse(intervalMinsConfig, out int parsedInterval)) intervalMins = parsedInterval;
            if (double.TryParse(multiplierConfig, out double parsedMultiplier)) multiplier = parsedMultiplier;
            if (decimal.TryParse(maxAmtConfig, out decimal parsedMax)) maxAmt = parsedMax;

            // Parse Holidays
            var holidaysDetailedStr = configs.FirstOrDefault(c => c.ConfigKey == "Holidays_Detailed")?.ConfigValue;
            var holidayMap = new Dictionary<string, HolidayDetail>(StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrEmpty(holidaysDetailedStr))
            {
                try
                {
                    var detailedList = JsonSerializer.Deserialize<List<HolidayDetail>>(holidaysDetailedStr);
                    if (detailedList != null)
                    {
                        foreach (var h in detailedList)
                        {
                            if (DateTime.TryParse(h.Date, out DateTime hDate))
                                holidayMap[hDate.ToString("yyyy-MM-dd")] = h;
                        }
                    }
                }
                catch { }
            }

            // Custom Adjustments
            var adjustmentsStr = configs.FirstOrDefault(c => c.ConfigKey == "Adjustments")?.ConfigValue;
            var adjustmentsList = new List<PayrollAdjustment>();
            if (!string.IsNullOrEmpty(adjustmentsStr))
            {
                try { adjustmentsList = JsonSerializer.Deserialize<List<PayrollAdjustment>>(adjustmentsStr) ?? new List<PayrollAdjustment>(); }
                catch { }
            }

            var users = await _context.Users
                .Include(u => u.UserLocations)
                .Include(u => u.Attendances).ThenInclude(a => a.Schedule)
                .Where(u => (u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3) && !u.IsDeleted)
                .ToListAsync();

            users = users.Where(u =>
                u.UserLocations.Any(ul => ul.LocationId == dto.LocationId) ||
                u.Attendances.Any(a => a.LocationId == dto.LocationId)
            ).ToList();

            // Xóa bản lương cũ cùng khoảng thời gian
            var oldPayrolls = await _context.WeeklyPayrolls
                .Where(wp => wp.LocationId == dto.LocationId && wp.FromDate == start && wp.ToDate == end)
                .ToListAsync();
            _context.WeeklyPayrolls.RemoveRange(oldPayrolls);

            var savedPayrolls = new List<object>();

            foreach (var user in users)
            {
                var userLoc = user.UserLocations.FirstOrDefault(ul => ul.LocationId == dto.LocationId);
                decimal hourlyWage = userLoc?.HourlyWage ?? 25000;

                var startCalc = start;
                if (user.LastSettledDate.HasValue && user.LastSettledDate.Value.Date >= start)
                {
                    startCalc = user.LastSettledDate.Value.Date.AddDays(1);
                }

                var userAtts = user.Attendances
                    .Where(a => a.CheckInTime.Date >= startCalc && a.CheckInTime.Date <= end && a.LocationId == dto.LocationId)
                    .ToList();

                double totalHours = 0;
                decimal baseSalary = 0;
                decimal penalty = 0;
                decimal bonus = 0;

                foreach (var att in userAtts)
                {
                    if (att.Schedule != null)
                    {
                        var baseDate = att.Schedule.Date.Date;
                        var schedStart2 = DateTime.SpecifyKind(baseDate.Add(att.Schedule.StartTime), att.CheckInTime.Kind);
                        var schedEnd = DateTime.SpecifyKind(baseDate.Add(att.Schedule.EndTime), att.CheckInTime.Kind);
                        if (att.Schedule.EndTime < att.Schedule.StartTime) schedEnd = schedEnd.AddDays(1);

                        if (att.CheckOutTime != null)
                        {
                            var checkOutLimit = att.CheckOutTime.Value > schedEnd ? schedEnd : att.CheckOutTime.Value;
                            var hours = (checkOutLimit - att.CheckInTime).TotalHours;
                            if (hours < 0) hours = 0;

                            // Bỏ qua ca làm dưới 30 phút
                            if (hours < 0.5) continue;

                            totalHours += hours;

                            var attDateStr = att.CheckInTime.ToString("yyyy-MM-dd");
                            var schedDateStr = att.Schedule.Date.ToString("yyyy-MM-dd");
                            HolidayDetail? holiday = null;
                            if (holidayMap.ContainsKey(attDateStr)) holiday = holidayMap[attDateStr];
                            else if (holidayMap.ContainsKey(schedDateStr)) holiday = holidayMap[schedDateStr];

                            if (holiday != null)
                            {
                                double mult = holiday.Multiplier > 0 ? holiday.Multiplier : 1.0;
                                baseSalary += (decimal)hours * hourlyWage;
                                bonus += (decimal)hours * hourlyWage * (decimal)(mult - 1.0) + holiday.FlatBonus;
                            }
                            else
                            {
                                baseSalary += (decimal)hours * hourlyWage;
                            }
                        }

                        if (att.CheckInTime > schedStart2)
                        {
                            var lateMin = (att.CheckInTime - schedStart2).TotalMinutes;
                            var latePenaltyAmt = CalculateLatePenalty(lateMin, startMins, baseAmt, intervalMins, multiplier, maxAmt);
                            
                            string autoRef = $"LATE_{user.Id}_{att.Schedule.Date:yyyy-MM-dd}_{att.Schedule.StartTime.ToString(@"hh\:mm")}";
                            bool isOverridden = adjustmentsList.Any(a => a.AutoRef == autoRef);

                            if (!isOverridden)
                            {
                                penalty += latePenaltyAmt;
                            }
                        }
                    }
                }

                // Adjustments
                var userAdjustments = adjustmentsList.Where(a => a.EmployeeId == user.Id).ToList();
                decimal advance = 0;
                foreach (var adj in userAdjustments)
                {
                    if (DateTime.TryParse(adj.Date, out DateTime adjDate) && adjDate.Date >= startCalc && adjDate.Date <= end)
                    {
                        decimal amount = adj.Amount > 0 ? adj.Amount : (decimal)adj.Quantity * adj.AmountPerUnit;
                        if (adj.Type == "bonus") bonus += amount;
                        else if (adj.Type == "penalty") penalty += amount;
                        else if (adj.Type == "advance") advance += amount;
                    }
                }

                // Dynamic bonus/penalty configs
                foreach (var config in configs)
                {
                    if (config.ConfigKey.StartsWith("Bonus_"))
                    {
                        var valStr = config.ConfigValue;
                        if (valStr.StartsWith("per_shift:"))
                        { if (decimal.TryParse(valStr.Substring(10), out decimal val)) bonus += val * userAtts.Count; }
                        else
                        { if (decimal.TryParse(valStr, out decimal val)) bonus += val; }
                    }
                    else if (config.ConfigKey.StartsWith("Penalty_"))
                    {
                        var valStr = config.ConfigValue;
                        if (valStr.StartsWith("per_shift:"))
                        { if (decimal.TryParse(valStr.Substring(10), out decimal val)) penalty += val * userAtts.Count; }
                        else
                        { if (decimal.TryParse(valStr, out decimal val)) penalty += val; }
                    }
                }

                decimal finalAmount = baseSalary + bonus - penalty - advance;

                var wp = new WeeklyPayroll
                {
                    UserId = user.Id,
                    LocationId = dto.LocationId,
                    FromDate = start,
                    ToDate = end,
                    TotalWorkedHours = Math.Round(totalHours, 1),
                    HourlyWage = hourlyWage,
                    BaseSalary = Math.Round(baseSalary),
                    TotalBonus = Math.Round(bonus),
                    TotalPenalty = Math.Round(penalty),
                    TotalAdvance = Math.Round(advance),
                    FinalAmount = Math.Round(finalAmount),
                    CreatedAt = DateTime.UtcNow
                };
                _context.WeeklyPayrolls.Add(wp);

                savedPayrolls.Add(new
                {
                    userId = user.Id,
                    fullName = user.FullName,
                    phoneNumber = user.PhoneNumber,
                    hourlyWage,
                    totalWorkedHours = wp.TotalWorkedHours,
                    baseSalary = wp.BaseSalary,
                    totalBonus = wp.TotalBonus,
                    totalPenalty = wp.TotalPenalty,
                    totalAdvance = wp.TotalAdvance,
                    finalAmount = wp.FinalAmount,
                    lastSettledDate = user.LastSettledDate?.ToString("yyyy-MM-dd"),
                    startCalculateDate = startCalc.ToString("yyyy-MM-dd")
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Chốt lương thành công!", data = savedPayrolls });
        }

        // 13. Lịch sử bảng lương đã chốt
        [HttpGet("payroll/history")]
        public async Task<IActionResult> GetPayrollHistory([FromQuery] string locationId)
        {
            if (string.IsNullOrEmpty(locationId)) return BadRequest("locationId is required");

            var records = await _context.WeeklyPayrolls
                .Include(wp => wp.User)
                .Where(wp => wp.LocationId == locationId)
                .OrderByDescending(wp => wp.CreatedAt)
                .ToListAsync();

            // Group by period
            var grouped = records
                .GroupBy(r => new { r.FromDate, r.ToDate })
                .Select(g => new
                {
                    fromDate = g.Key.FromDate.ToString("yyyy-MM-dd"),
                    toDate = g.Key.ToDate.ToString("yyyy-MM-dd"),
                    createdAt = g.First().CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                    employees = g.Select(r => new
                    {
                        userId = r.UserId,
                        fullName = r.User?.FullName,
                        phoneNumber = r.User?.PhoneNumber,
                        hourlyWage = r.HourlyWage,
                        totalWorkedHours = r.TotalWorkedHours,
                        baseSalary = r.BaseSalary,
                        totalBonus = r.TotalBonus,
                        totalPenalty = r.TotalPenalty,
                        totalAdvance = r.TotalAdvance,
                        finalAmount = r.FinalAmount
                    }).ToList()
                })
                .ToList();

            return Ok(grouped);
        }

        public class SavePayrollDto
        {
            public string LocationId { get; set; } = string.Empty;
            public string FromDate { get; set; } = string.Empty;
            public string ToDate { get; set; } = string.Empty;
        }

        // 13. Notifications endpoints
        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications([FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(userId)) return BadRequest("userId is required");

            var list = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.UserId,
                    n.Title,
                    n.Message,
                    n.IsRead,
                    createdAt = n.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost("notifications/{id}/read")]
        public async Task<IActionResult> MarkNotificationRead(string id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound("Notification not found");

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }

        // Web Push Subscriptions and Sending
        public class PushSubscribeDto
        {
            public string UserId { get; set; } = null!;
            public string Endpoint { get; set; } = null!;
            public string P256Dh { get; set; } = null!;
            public string Auth { get; set; } = null!;
        }

        [HttpPost("push/subscribe")]
        public async Task<IActionResult> SubscribePush([FromBody] PushSubscribeDto dto)
        {
            if (string.IsNullOrEmpty(dto.UserId) || string.IsNullOrEmpty(dto.Endpoint))
            {
                return BadRequest("Invalid subscription data");
            }

            var existing = await _context.DeviceSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == dto.UserId && s.Endpoint == dto.Endpoint);

            if (existing == null)
            {
                var sub = new DeviceSubscription
                {
                    UserId = dto.UserId,
                    Endpoint = dto.Endpoint,
                    P256Dh = dto.P256Dh,
                    Auth = dto.Auth
                };
                _context.DeviceSubscriptions.Add(sub);
            }
            else
            {
                existing.P256Dh = dto.P256Dh;
                existing.Auth = dto.Auth;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Subscribed successfully" });
        }

        public class PushUnsubscribeDto
        {
            public string Endpoint { get; set; } = null!;
        }

        [HttpPost("push/unsubscribe")]
        public async Task<IActionResult> UnsubscribePush([FromBody] PushUnsubscribeDto dto)
        {
            if (string.IsNullOrEmpty(dto.Endpoint))
            {
                return BadRequest("Invalid subscription data");
            }

            var subscriptions = await _context.DeviceSubscriptions
                .Where(s => s.Endpoint == dto.Endpoint)
                .ToListAsync();

            if (subscriptions.Any())
            {
                _context.DeviceSubscriptions.RemoveRange(subscriptions);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Unsubscribed successfully" });
        }

        private async Task SendPushNotification(string userId, string title, string message)
        {
            try
            {
                var subscriptions = await _context.DeviceSubscriptions
                    .Where(s => s.UserId == userId)
                    .ToListAsync();

                if (!subscriptions.Any()) return;

                var publicKey = "BA4Sd0l3Lz3CDUBwhnuop63n0Wd7zQo5UA4wz12aNdZshB9CXhbqsWMUCMdaMKNw2KE_9vgoKcc97rDTTX1cPuw";
                var privateKey = "pvBAOs4zitft11t-5TNWCG7eiJDDl4NAG4FFjDUUAX4";
                var subject = "mailto:admin@themoods.com";

                var vapidDetails = new WebPush.VapidDetails(subject, publicKey, privateKey);
                var webPushClient = new WebPush.WebPushClient();

                foreach (var sub in subscriptions)
                {
                    try
                    {
                        var pushSubscription = new WebPush.PushSubscription(sub.Endpoint, sub.P256Dh, sub.Auth);
                        var payload = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            title = title,
                            body = message,
                            icon = "/logo.png"
                        });

                        await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error sending individual push: " + ex.Message);
                        if (ex.Message.Contains("404") || ex.Message.Contains("410") || ex.Message.Contains("Gone"))
                        {
                            _context.DeviceSubscriptions.Remove(sub);
                        }
                    }
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in SendPushNotification: " + ex.Message);
            }
        }

        // DEBUG: Test push notification with detailed results
        [HttpPost("push/test")]
        public async Task<IActionResult> TestPush([FromBody] TestPushDto dto)
        {
            if (string.IsNullOrEmpty(dto.UserId))
                return BadRequest("UserId is required");

            var subscriptions = await _context.DeviceSubscriptions
                .Where(s => s.UserId == dto.UserId)
                .ToListAsync();

            if (!subscriptions.Any())
                return Ok(new { message = "No subscriptions found", userId = dto.UserId, count = 0 });

            var publicKey = "BA4Sd0l3Lz3CDUBwhnuop63n0Wd7zQo5UA4wz12aNdZshB9CXhbqsWMUCMdaMKNw2KE_9vgoKcc97rDTTX1cPuw";
            var privateKey = "pvBAOs4zitft11t-5TNWCG7eiJDDl4NAG4FFjDUUAX4";
            var subject = "mailto:admin@themoods.com";

            var results = new List<object>();
            var vapidDetails = new WebPush.VapidDetails(subject, publicKey, privateKey);
            var webPushClient = new WebPush.WebPushClient();

            foreach (var sub in subscriptions)
            {
                try
                {
                    var pushSubscription = new WebPush.PushSubscription(sub.Endpoint, sub.P256Dh, sub.Auth);
                    var payload = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        title = "🔔 Test Thông Báo",
                        body = "Đây là thông báo thử nghiệm từ The Moods! " + DateTime.UtcNow.ToString("HH:mm:ss"),
                        icon = "/logo.png",
                        url = "/"
                    });

                    await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                    results.Add(new { endpoint = sub.Endpoint.Substring(0, Math.Min(sub.Endpoint.Length, 60)) + "...", status = "SUCCESS" });
                }
                catch (WebPush.WebPushException wpEx)
                {
                    results.Add(new { 
                        endpoint = sub.Endpoint.Substring(0, Math.Min(sub.Endpoint.Length, 60)) + "...", 
                        status = "FAILED", 
                        error = wpEx.Message,
                        statusCode = wpEx.StatusCode.ToString(),
                        httpStatus = (int)wpEx.StatusCode
                    });
                    // Remove expired/invalid subscriptions
                    if ((int)wpEx.StatusCode == 404 || (int)wpEx.StatusCode == 410)
                    {
                        _context.DeviceSubscriptions.Remove(sub);
                    }
                }
                catch (Exception ex)
                {
                    results.Add(new { 
                        endpoint = sub.Endpoint.Substring(0, Math.Min(sub.Endpoint.Length, 60)) + "...", 
                        status = "ERROR", 
                        error = ex.Message 
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Test push completed", userId = dto.UserId, totalSubs = subscriptions.Count, results });
        }

        // DEBUG: List all device subscriptions
        [HttpGet("push/subscriptions")]
        public async Task<IActionResult> GetSubscriptions([FromQuery] string? userId = null)
        {
            var query = _context.DeviceSubscriptions.AsQueryable();
            if (!string.IsNullOrEmpty(userId))
                query = query.Where(s => s.UserId == userId);

            var subs = await query.Select(s => new {
                s.Id,
                s.UserId,
                Endpoint = s.Endpoint.Substring(0, Math.Min(s.Endpoint.Length, 80)) + "...",
                HasP256Dh = !string.IsNullOrEmpty(s.P256Dh),
                HasAuth = !string.IsNullOrEmpty(s.Auth)
            }).ToListAsync();

            return Ok(new { count = subs.Count, subscriptions = subs });
        }

        // 14. Tất toán lương cho từng nhân sự đến ngày chỉ định
        [HttpPost("payroll/settle")]
        public async Task<IActionResult> SettlePayroll([FromBody] SettlePayrollDto dto)
        {
            if (string.IsNullOrEmpty(dto.UserId))
                return BadRequest("UserId is required");

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return NotFound("User not found");

            var dateVal = DateTime.SpecifyKind(DateTime.Parse(dto.SettledToDate).Date, DateTimeKind.Utc);
            user.LastSettledDate = dateVal;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Tất toán lương thành công cho {user.FullName} đến ngày {dto.SettledToDate}!", lastSettledDate = user.LastSettledDate?.ToString("yyyy-MM-dd") });
        }
    }

    public class TestPushDto
    {
        public string UserId { get; set; } = "";
    }

    public class SettlePayrollDto
    {
        public string UserId { get; set; } = string.Empty;
        public string SettledToDate { get; set; } = string.Empty;
    }
}
