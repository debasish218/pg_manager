using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PgManager.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTenantRentAndSharingType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // RentAmount and SharingType are now derived from the Room entity.
            // These columns are no longer stored on the Tenant.
            migrationBuilder.DropColumn(
                name: "RentAmount",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SharingType",
                table: "Tenants");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RentAmount",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SharingType",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
