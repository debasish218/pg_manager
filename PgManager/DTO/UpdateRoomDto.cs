using System.ComponentModel.DataAnnotations;

namespace PgManager.DTOs.Room
{
    public class UpdateRoomDto
    {
        public int? RoomNumber { get; set; }

        [Range(1, 6)]
        public int? SharingType { get; set; }

        [Range(1, 10)]
        public int? TotalBeds { get; set; }

        public int? RentPerBed { get; set; }
        public int? Floor { get; set; }
    }
}