using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PgManager.Entities
{
    public class Tenant
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; }

        [Required]
        public SharingType SharingType { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int RoomId { get; set; }

        [Required]
        public int RentAmount { get; set; }

        [Required]
        public int AdvanceAmount { get; set; }

        [Required]
        public DateTime JoinDate { get; set; }

        public DateTime? LastPaidDate { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [Required]
        public int DueAmount { get; set; } = 0;

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [ForeignKey("RoomId")]
        public virtual Room Room { get; set; }

        // Computed Properties
        [NotMapped]
        public int DaysSinceLastPayment
        {
            get
            {
                var referenceDate = LastPaidDate ?? JoinDate;
                return (DateTime.UtcNow.Date - referenceDate.Date).Days;
            }
        }

        [NotMapped]
        public bool IsOverdue => DaysSinceLastPayment > 30;
    }
}