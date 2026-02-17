using System.ComponentModel.DataAnnotations;

namespace PgManager.DTOs.Tenant
{
    public class UpdatePaymentDto
    {
        [Required(ErrorMessage = "Payment date is required")]
        public DateTime PaymentDate { get; set; }

        [Required(ErrorMessage = "Paid amount is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Paid amount must be greater than 0")]
        public int PaidAmount { get; set; }
    }
}