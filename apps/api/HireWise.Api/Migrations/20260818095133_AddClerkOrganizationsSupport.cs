using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireWise.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClerkOrganizationsSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClerkOrganizationId",
                table: "Companies",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Companies_ClerkOrganizationId",
                table: "Companies",
                column: "ClerkOrganizationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Companies_Slug",
                table: "Companies",
                column: "Slug");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Companies_ClerkOrganizationId",
                table: "Companies");

            migrationBuilder.DropIndex(
                name: "IX_Companies_Slug",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ClerkOrganizationId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Companies");
        }
    }
}
