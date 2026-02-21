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

        /// <summary>
        /// Number of complete calendar months elapsed since last payment (or join date).
        /// Uses AddMonths so Feb/Mar/etc lengths are handled correctly.
        /// </summary>
        [NotMapped]
        public int MonthsElapsed
        {
            get
            {
                var referenceDate = (LastPaidDate ?? JoinDate).Date;
                var today = DateTime.UtcNow.Date;

                int months = 0;
                while (referenceDate.AddMonths(months + 1) <= today)
                    months++;

                return months;
            }
        }

        [NotMapped]
        public int DaysSinceLastPayment
        {
            get
            {
                var referenceDate = LastPaidDate ?? JoinDate;
                return (DateTime.UtcNow.Date - referenceDate.Date).Days;
            }
        }

        /// <summary>
        /// True when at least one full calendar month has passed since last payment,
        /// OR when LastPaidDate is null (rent immediately due on join).
        /// </summary>
        [NotMapped]
        public bool IsOverdue => !LastPaidDate.HasValue || MonthsElapsed > 0;

        /// <summary>
        /// Auto-calculated total due:
        ///   DueAmount (stored residual from partial payments)
        ///   + (MonthsElapsed × RentAmount)
        ///
        /// Special case: if LastPaidDate is null (no payment ever recorded)
        ///   → rent is immediately due without waiting for one month.
        ///   → CurrentDue = DueAmount + ((MonthsElapsed + 1) × RentAmount)
        /// </summary>
        [NotMapped]
        public int CurrentDue
        {
            get
            {
                if (!LastPaidDate.HasValue)
                {
                    // No payment on record — rent is due from day 1
                    return DueAmount + ((MonthsElapsed + 1) * RentAmount);
                }
                return DueAmount + (MonthsElapsed * RentAmount);
            }
        }
    }
}