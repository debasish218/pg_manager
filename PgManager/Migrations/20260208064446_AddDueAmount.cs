using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PgManager.Migrations
{
    /// <inheritdoc />
    public partial class AddDueAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DueAmount",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DueAmount",
                table: "Tenants");
        }
    }
}
