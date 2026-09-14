using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheMoods.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLastSettledDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "WeeklyPayrolls",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyWage",
                table: "WeeklyPayrolls",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAdvance",
                table: "WeeklyPayrolls",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSettledDate",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SwapWithShiftId",
                table: "StaffRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SwapWithStaffId",
                table: "StaffRequests",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DeviceSubscriptions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Endpoint = table.Column<string>(type: "text", nullable: false),
                    P256Dh = table.Column<string>(type: "text", nullable: false),
                    Auth = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceSubscriptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceSubscriptions");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "WeeklyPayrolls");

            migrationBuilder.DropColumn(
                name: "HourlyWage",
                table: "WeeklyPayrolls");

            migrationBuilder.DropColumn(
                name: "TotalAdvance",
                table: "WeeklyPayrolls");

            migrationBuilder.DropColumn(
                name: "LastSettledDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SwapWithShiftId",
                table: "StaffRequests");

            migrationBuilder.DropColumn(
                name: "SwapWithStaffId",
                table: "StaffRequests");
        }
    }
}
