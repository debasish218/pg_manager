using Microsoft.EntityFrameworkCore;
using PgManager.Data;
using PgManager.DTOs.Room;
using PgManager.Entities;
using PgManager.Services.Interfaces;

namespace PgManager.Services
{
    public class RoomService : IRoomService
    {
        private readonly ApplicationDbContext _context;

        public RoomService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, IEnumerable<RoomDto>? Data, List<string>? Errors)> GetAllRoomsAsync(int userId, string? searchTerm = null, int? sharingType = null)
        {
            try
            {
                var query = _context.Rooms
                    .Where(r => r.UserId == userId)
                    .Include(r => r.Tenants.Where(t => t.IsActive))
                    .AsQueryable();

                // Search by room number (numeric equality or contains if converted to string)
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    if (int.TryParse(searchTerm, out int roomNum))
                    {
                        query = query.Where(r => r.RoomNumber == roomNum);
                    }
                }

                // Filter by sharing type
                if (sharingType.HasValue)
                {
                    query = query.Where(r => (int)r.SharingType == sharingType.Value);
                }

                // Fetch data first, then sort in memory
                var rooms = await query.ToListAsync();

                // Sort by room number ascending
                var sortedRooms = rooms
                    .OrderBy(r => r.RoomNumber)
                    .ToList();

                var roomDtos = sortedRooms.Select(r => new RoomDto
                {
                    Id = r.Id,
                    RoomNumber = r.RoomNumber,
                    SharingType = r.SharingType.ToString(),
                    TotalBeds = r.TotalBeds,
                    OccupiedBeds = r.OccupiedBeds,
                    AvailableBeds = r.AvailableBeds,
                    IsAvailable = r.IsAvailable,
                    ActiveTenants = r.Tenants.Count(t => t.IsActive),
                    RentPerBed = r.RentPerBed,
                    Floor = r.Floor,
                    CreatedAt = r.CreatedAt,
                    Tenants = r.Tenants.Select(t => new PgManager.DTOs.Tenant.TenantDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        PhoneNumber = t.PhoneNumber,
                        SharingType = t.SharingType.ToString(),
                        RoomId = t.RoomId,
                        RoomNumber = r.RoomNumber,
                        RentAmount = t.RentAmount,
                        AdvanceAmount = t.AdvanceAmount,
                        JoinDate = t.JoinDate,
                        LastPaidDate = t.LastPaidDate,
                        IsActive = t.IsActive,
                        DaysSinceLastPayment = t.DaysSinceLastPayment,
                        IsOverdue = t.IsOverdue,
                        DueAmount = t.DueAmount,
                        CreatedAt = t.CreatedAt
                    }).ToList()
                }).ToList();

                return (true, "Rooms retrieved successfully", roomDtos, null);
            }
            catch (Exception ex)
            {
                return (false, "Error retrieving rooms", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, RoomDto? Data, List<string>? Errors)> GetRoomByIdAsync(int userId, int id)
        {
            try
            {
                var room = await _context.Rooms
                    .Where(r => r.UserId == userId)
                    .Include(r => r.Tenants.Where(t => t.IsActive))
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (room == null)
                {
                    return (false, "Room not found", null, new List<string> { "Room does not exist" });
                }

                var roomDto = new RoomDto
                {
                    Id = room.Id,
                    RoomNumber = room.RoomNumber,
                    SharingType = room.SharingType.ToString(),
                    TotalBeds = room.TotalBeds,
                    OccupiedBeds = room.OccupiedBeds,
                    AvailableBeds = room.AvailableBeds,
                    IsAvailable = room.IsAvailable,
                    ActiveTenants = room.Tenants.Count(t => t.IsActive),
                    RentPerBed = room.RentPerBed,
                    Floor = room.Floor,
                    CreatedAt = room.CreatedAt,
                    Tenants = room.Tenants.Select(t => new PgManager.DTOs.Tenant.TenantDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        PhoneNumber = t.PhoneNumber,
                        SharingType = t.SharingType.ToString(),
                        RoomId = t.RoomId,
                        RoomNumber = room.RoomNumber,
                        RentAmount = t.RentAmount,
                        AdvanceAmount = t.AdvanceAmount,
                        JoinDate = t.JoinDate,
                        LastPaidDate = t.LastPaidDate,
                        IsActive = t.IsActive,
                        DaysSinceLastPayment = t.DaysSinceLastPayment,
                        IsOverdue = t.IsOverdue,
                        DueAmount = t.DueAmount,
                        CreatedAt = t.CreatedAt
                    }).ToList()
                };

                return (true, "Room retrieved successfully", roomDto, null);
            }
            catch (Exception ex)
            {
                return (false, "Error retrieving room", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, IEnumerable<RoomDto>? Data, List<string>? Errors)> GetAvailableRoomsBySharingTypeAsync(int userId, int sharingType)
        {
            try
            {
                // Fetch data first
                var rooms = await _context.Rooms
                    .Where(r => r.UserId == userId)
                    .Include(r => r.Tenants.Where(t => t.IsActive))
                    .Where(r => (int)r.SharingType == sharingType)
                    .ToListAsync();

                // Sort numerically in memory
                var availableRooms = rooms
                    .Where(r => r.OccupiedBeds < r.TotalBeds)
                    .OrderBy(r => r.RoomNumber)
                    .ToList();

                var roomDtos = availableRooms.Select(r => new RoomDto
                {
                    Id = r.Id,
                    RoomNumber = r.RoomNumber,
                    SharingType = r.SharingType.ToString(),
                    TotalBeds = r.TotalBeds,
                    OccupiedBeds = r.OccupiedBeds,
                    AvailableBeds = r.AvailableBeds,
                    IsAvailable = r.IsAvailable,
                    ActiveTenants = r.Tenants.Count(t => t.IsActive),
                    RentPerBed = r.RentPerBed,
                    Floor = r.Floor,
                    CreatedAt = r.CreatedAt
                }).ToList();

                return (true, "Available rooms retrieved successfully", roomDtos, null);
            }
            catch (Exception ex)
            {
                return (false, "Error retrieving available rooms", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, RoomDto? Data, List<string>? Errors)> CreateRoomAsync(int userId, CreateRoomDto createRoomDto)
        {
            try
            {
                // Check if room number already exists for this user
                var existingRoom = await _context.Rooms
                    .Where(r => r.UserId == userId)
                    .FirstOrDefaultAsync(r => r.RoomNumber == createRoomDto.RoomNumber);

                if (existingRoom != null)
                {
                    return (false, "Room number already exists", null, new List<string> { "A room with this number already exists" });
                }

                var room = new Room
                {
                    UserId = userId,
                    RoomNumber = createRoomDto.RoomNumber,
                    SharingType = (SharingType)createRoomDto.SharingType,
                    TotalBeds = createRoomDto.TotalBeds,
                    OccupiedBeds = 0,
                    RentPerBed = createRoomDto.RentPerBed,
                    Floor = createRoomDto.Floor,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                var roomDto = new RoomDto
                {
                    Id = room.Id,
                    RoomNumber = room.RoomNumber,
                    SharingType = room.SharingType.ToString(),
                    TotalBeds = room.TotalBeds,
                    OccupiedBeds = room.OccupiedBeds,
                    AvailableBeds = room.AvailableBeds,
                    IsAvailable = room.IsAvailable,
                    ActiveTenants = 0,
                    RentPerBed = room.RentPerBed,
                    Floor = room.Floor,
                    CreatedAt = room.CreatedAt
                };

                return (true, "Room created successfully", roomDto, null);
            }
            catch (Exception ex)
            {
                return (false, "Error creating room", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, RoomDto? Data, List<string>? Errors)> UpdateRoomAsync(int userId, int id, UpdateRoomDto updateRoomDto)
        {
            try
            {
                var room = await _context.Rooms
                    .Where(r => r.UserId == userId)
                    .Include(r => r.Tenants.Where(t => t.IsActive))
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (room == null)
                {
                    return (false, "Room not found", null, new List<string> { "Room does not exist" });
                }

                // Update only provided fields
                if (updateRoomDto.RoomNumber.HasValue)
                {
                    // Check if new room number already exists
                    var existingRoom = await _context.Rooms
                        .FirstOrDefaultAsync(r => r.RoomNumber == updateRoomDto.RoomNumber.Value && r.Id != id);

                    if (existingRoom != null)
                    {
                        return (false, "Room number already exists", null, new List<string> { "A room with this number already exists" });
                    }
                    room.RoomNumber = updateRoomDto.RoomNumber.Value;
                }

                if (updateRoomDto.SharingType.HasValue)
                {
                    room.SharingType = (SharingType)updateRoomDto.SharingType.Value;
                }

                if (updateRoomDto.TotalBeds.HasValue)
                {
                    if (updateRoomDto.TotalBeds.Value < room.OccupiedBeds)
                    {
                        return (false, "Cannot reduce total beds below occupied beds", null,
                            new List<string> { $"Current occupied beds: {room.OccupiedBeds}" });
                    }
                    room.TotalBeds = updateRoomDto.TotalBeds.Value;
                }

                if (updateRoomDto.RentPerBed.HasValue)
                {
                    room.RentPerBed = updateRoomDto.RentPerBed.Value;
                }

                if (updateRoomDto.Floor.HasValue)
                {
                    room.Floor = updateRoomDto.Floor.Value;
                }

                room.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var roomDto = new RoomDto
                {
                    Id = room.Id,
                    RoomNumber = room.RoomNumber,
                    SharingType = room.SharingType.ToString(),
                    TotalBeds = room.TotalBeds,
                    OccupiedBeds = room.OccupiedBeds,
                    AvailableBeds = room.AvailableBeds,
                    IsAvailable = room.IsAvailable,
                    ActiveTenants = room.Tenants.Count(t => t.IsActive),
                    RentPerBed = room.RentPerBed,
                    Floor = room.Floor,
                    CreatedAt = room.CreatedAt
                };

                return (true, "Room updated successfully", roomDto, null);
            }
            catch (Exception ex)
            {
                return (false, "Error updating room", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, List<string>? Errors)> DeleteRoomAsync(int userId, int id)
        {
            try
            {
                var room = await _context.Rooms
                    .Where(r => r.UserId == userId)
                    .Include(r => r.Tenants)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (room == null)
                {
                    return (false, "Room not found", new List<string> { "Room does not exist" });
                }

                // Check if room has active tenants
                if (room.Tenants.Any(t => t.IsActive))
                {
                    return (false, "Cannot delete room with active tenants",
                        new List<string> { "Please move or deactivate all tenants before deleting the room" });
                }

                _context.Rooms.Remove(room);
                await _context.SaveChangesAsync();

                return (true, "Room deleted successfully", null);
            }
            catch (Exception ex)
            {
                return (false, "Error deleting room", new List<string> { ex.Message });
            }
        }
    }
}