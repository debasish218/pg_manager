namespace PgManager.DTOs.Tenant
{
    public class TenantDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
        public string SharingType { get; set; }
        public int RoomId { get; set; }
        public int RoomNumber { get; set; }
        public int RentAmount { get; set; }
        public int AdvanceAmount { get; set; }
        public DateTime JoinDate { get; set; }
        public DateTime? LastPaidDate { get; set; }
        public bool IsActive { get; set; }
        public int DaysSinceLastPayment { get; set; }
        public bool IsOverdue { get; set; }
        public int DueAmount { get; set; }      // stored residual (unpaid balance)
        public int CurrentDue { get; set; }     // auto-calculated: DueAmount + months × rent
        public int MonthsElapsed { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}