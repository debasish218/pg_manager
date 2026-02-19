using System.ComponentModel.DataAnnotations;

namespace PgManager.DTO
{
    public class UpdateProfileDto
    {
        [Required]
        public required string PgName { get; set; }

        public string? Name { get; set; }
    }
}
