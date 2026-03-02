using System.ComponentModel.DataAnnotations;

namespace PgManager.DTOs.Tenant
{
    public class CreateTenantDto
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100)]
        public string Name { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        [StringLength(15)]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be 10 digits")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Room ID is required")]
        public int RoomId { get; set; }

        [Range(0, 1000000, ErrorMessage = "Advance amount must be 0 or greater")]
        public int AdvanceAmount { get; set; }

        [Required(ErrorMessage = "Join date is required")]
        public DateTime JoinDate { get; set; }

        public DateTime? LastPaidDate { get; set; }

        public bool IsActive { get; set; } = true;

        [Range(0, 1000000, ErrorMessage = "Due amount must be 0 or greater")]
        public int DueAmount { get; set; } = 0;
    }
}
