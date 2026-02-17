using System.ComponentModel.DataAnnotations;

namespace PgManager.DTOs.Tenant
{
    public class UpdateTenantDto
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [StringLength(15)]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be 10 digits")]
        public string? PhoneNumber { get; set; }

        [Range(1, 1000000)]
        public int? RentAmount { get; set; }

        [Range(0, 1000000)]
        public int? AdvanceAmount { get; set; }

        public DateTime? LastPaidDate { get; set; }

        public bool? IsActive { get; set; }

        public int? RoomId { get; set; }

        [Range(0, 1000000)]
        public int? DueAmount { get; set; }
    }
}