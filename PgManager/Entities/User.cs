using System.ComponentModel.DataAnnotations;

namespace PgManager.Entities
{
    public class User
    {
        public int Id { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        [Required]
        public required string PgName { get; set; }

        public string? TotpSecret { get; set; } // Nullable initially for setup

        public string? Name { get; set; }

        public string Role { get; set; } = "User";
    }
}
