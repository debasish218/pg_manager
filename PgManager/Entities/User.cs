using System.ComponentModel.DataAnnotations;

namespace PgManager.Entities
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public required string PhoneNumber { get; set; }

        [Required]
        public required string PgName { get; set; }

        public string? TotpSecret { get; set; } // Nullable initially for setup

        public string? Name { get; set; }

        public string Role { get; set; } = "User";
    }
}
