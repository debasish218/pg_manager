using System.ComponentModel.DataAnnotations;

namespace PgManager.DTO
{
    public class UpdateProfileDto
    {
        [Required]
        public required string PgName { get; set; }

        public string? Name { get; set; }
        
        public string? PhoneNumber { get; set; }
    }
}
