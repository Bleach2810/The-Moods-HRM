using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheMoods.Data.Migrations
{
    /// <inheritdoc />
    public partial class DataIsolation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RoleId",
                table: "UserLocations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "LocationId",
                table: "Notifications",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "UserLocations");

            migrationBuilder.DropColumn(
                name: "LocationId",
                table: "Notifications");
        }
    }
}
