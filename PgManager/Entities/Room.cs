using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PgManager.Entities
{
    public class Room
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int RoomNumber { get; set; }

        [Required]
        public SharingType SharingType { get; set; }

        [Required]
        [Range(1, 10)]
        public int TotalBeds { get; set; }

        public int OccupiedBeds { get; set; } = 0;

        public int RentPerBed { get; set; } = 0;
        public int Floor { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        public virtual ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();

        // Computed Properties
        [NotMapped]
        public int AvailableBeds => TotalBeds - OccupiedBeds;

        [NotMapped]
        public bool IsAvailable => OccupiedBeds < TotalBeds;
    }
    public enum SharingType
    {
        Single = 1,
        Double = 2,
        Triple = 3,
        Four = 4,
        Five = 5,
        Six = 6
    }
}