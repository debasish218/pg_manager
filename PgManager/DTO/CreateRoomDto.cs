using System.ComponentModel.DataAnnotations;

namespace PgManager.DTOs.Room
{
    public class CreateRoomDto
    {
        [Required(ErrorMessage = "Room number is required")]
        public int RoomNumber { get; set; }

        [Required(ErrorMessage = "Sharing type is required")]
        [Range(1, 6, ErrorMessage = "Sharing type must be between 1 and 6")]
        public int SharingType { get; set; }

        [Required(ErrorMessage = "Total beds is required")]
        [Range(1, 10, ErrorMessage = "Total beds must be between 1 and 10")]
        public int TotalBeds { get; set; }

        public int RentPerBed { get; set; }
        public int Floor { get; set; }
    }
}