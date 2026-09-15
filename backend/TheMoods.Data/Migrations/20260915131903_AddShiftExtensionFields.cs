using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheMoods.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftExtensionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExtensionDurationMinutes",
                table: "StaffRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "OriginalStartTime",
                table: "StaffRequests",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "RequestedEndTime",
                table: "StaffRequests",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "RequestedStartTime",
                table: "StaffRequests",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExtensionDurationMinutes",
                table: "OfficialSchedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "OriginalEndTime",
                table: "OfficialSchedules",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "OriginalStartTime",
                table: "OfficialSchedules",
                type: "interval",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtensionDurationMinutes",
                table: "StaffRequests");

            migrationBuilder.DropColumn(
                name: "OriginalStartTime",
                table: "StaffRequests");

            migrationBuilder.DropColumn(
                name: "RequestedEndTime",
                table: "StaffRequests");

            migrationBuilder.DropColumn(
                name: "RequestedStartTime",
                table: "StaffRequests");

            migrationBuilder.DropColumn(
                name: "ExtensionDurationMinutes",
                table: "OfficialSchedules");

            migrationBuilder.DropColumn(
                name: "OriginalEndTime",
                table: "OfficialSchedules");

            migrationBuilder.DropColumn(
                name: "OriginalStartTime",
                table: "OfficialSchedules");
        }
    }
}
