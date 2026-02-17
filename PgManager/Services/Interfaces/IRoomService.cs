using PgManager.DTOs.Room;

namespace PgManager.Services.Interfaces
{
    public interface IRoomService
    {
        Task<(bool Success, string Message, IEnumerable<RoomDto>? Data, List<string>? Errors)> GetAllRoomsAsync(int userId, string? searchTerm = null, int? sharingType = null);
        Task<(bool Success, string Message, RoomDto? Data, List<string>? Errors)> GetRoomByIdAsync(int userId, int id);
        Task<(bool Success, string Message, IEnumerable<RoomDto>? Data, List<string>? Errors)> GetAvailableRoomsBySharingTypeAsync(int userId, int sharingType);
        Task<(bool Success, string Message, RoomDto? Data, List<string>? Errors)> CreateRoomAsync(int userId, CreateRoomDto createRoomDto);
        Task<(bool Success, string Message, RoomDto? Data, List<string>? Errors)> UpdateRoomAsync(int userId, int id, UpdateRoomDto updateRoomDto);
        Task<(bool Success, string Message, List<string>? Errors)> DeleteRoomAsync(int userId, int id);
    }
}