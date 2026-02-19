using Microsoft.AspNetCore.Mvc;
using PgManager.DTOs.Room;
using PgManager.Services.Interfaces;

namespace PgManager.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : BaseApiController
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        /// <summary>
        /// Get all rooms with optional filters
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllRooms(
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? sharingType = null)
        {
            var userId = GetCurrentUserId();
            var result = await _roomService.GetAllRoomsAsync(userId, searchTerm, sharingType);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Get room by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRoomById(int id)
        {
            var userId = GetCurrentUserId();
            var result = await _roomService.GetRoomByIdAsync(userId, id);

            if (!result.Success)
                return NotFound(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Get available rooms by sharing type (for tenant assignment)
        /// </summary>
        [HttpGet("available/{sharingType}")]
        public async Task<IActionResult> GetAvailableRoomsBySharingType(int sharingType)
        {
            var userId = GetCurrentUserId();
            var result = await _roomService.GetAvailableRoomsBySharingTypeAsync(userId, sharingType);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Create a new room
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto createRoomDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _roomService.CreateRoomAsync(userId, createRoomDto);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return CreatedAtAction(nameof(GetRoomById),
                new { id = result.Data.Id },
                new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Update an existing room
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomDto updateRoomDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _roomService.UpdateRoomAsync(userId, id, updateRoomDto);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Delete a room
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var userId = GetCurrentUserId();
            var result = await _roomService.DeleteRoomAsync(userId, id);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message });
        }
    }
}