using PgManager.DTOs.Tenant;

namespace PgManager.DTOs.Room
{
    public class RoomDto
    {
        public int Id { get; set; }
        public int RoomNumber { get; set; }
        public string SharingType { get; set; }
        public int TotalBeds { get; set; }
        public int OccupiedBeds { get; set; }
        public int AvailableBeds { get; set; }
        public bool IsAvailable { get; set; }
        public int ActiveTenants { get; set; }
        public int RentPerBed { get; set; }
        public int Floor { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<TenantDto> Tenants { get; set; } = new List<TenantDto>();
    }
}