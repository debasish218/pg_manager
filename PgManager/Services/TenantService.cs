using Microsoft.EntityFrameworkCore;
using PgManager.Data;
using PgManager.DTOs.Tenant;
using PgManager.Entities;
using PgManager.Services.Interfaces;

namespace PgManager.Services
{
    public class TenantService : ITenantService
    {
        private readonly ApplicationDbContext _context;

        public TenantService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper: build TenantDto from entity — rent and sharing type come from Room
        private static TenantDto ToDto(Tenant t) => new TenantDto
        {
            Id = t.Id,
            Name = t.Name,
            PhoneNumber = t.PhoneNumber,
            SharingType = t.Room?.SharingType.ToString() ?? "",
            RoomId = t.RoomId,
            RoomNumber = t.Room?.RoomNumber ?? 0,
            RentAmount = t.Room?.RentPerBed ?? 0,
            AdvanceAmount = t.AdvanceAmount,
            JoinDate = t.JoinDate,
            LastPaidDate = t.LastPaidDate,
            IsActive = t.IsActive,
            DaysSinceLastPayment = t.DaysSinceLastPayment,
            IsOverdue = t.IsOverdue,
            DueAmount = t.DueAmount,
            CurrentDue = t.CurrentDue,
            MonthsElapsed = t.MonthsElapsed,
            CreatedAt = t.CreatedAt
        };

        public async Task<(bool Success, string Message, IEnumerable<TenantDto>? Data, List<string>? Errors)> GetAllTenantsAsync(
            int userId,
            string? searchTerm = null,
            int? sharingType = null,
            bool? isActive = null)
        {
            try
            {
                var query = _context.Tenants
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Room)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(t => t.Name.Contains(searchTerm) || t.PhoneNumber.Contains(searchTerm));
                }

                // Filter by sharing type — derived from room
                if (sharingType.HasValue)
                {
                    query = query.Where(t => (int)t.Room.SharingType == sharingType.Value);
                }

                if (isActive.HasValue)
                {
                    query = query.Where(t => t.IsActive == isActive.Value);
                }

                var tenants = await query.ToListAsync();

                var sortedTenants = tenants
                    .OrderByDescending(t => t.IsActive)
                    .ThenByDescending(t => t.DueAmount)
                    .Select(ToDto)
                    .ToList();

                return (true, "Tenants retrieved successfully", sortedTenants, null);
            }
            catch (Exception ex)
            {
                return (false, "Error retrieving tenants", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> GetTenantByIdAsync(int userId, int id)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Room)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tenant == null)
                    return (false, "Tenant not found", null, new List<string> { "Tenant does not exist" });

                return (true, "Tenant retrieved successfully", ToDto(tenant), null);
            }
            catch (Exception ex)
            {
                return (false, "Error retrieving tenant", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, IEnumerable<TenantDto>? Data, List<string>? Errors)> GetOverdueTenantsAsync(int userId)
        {
            try
            {
                var tenants = await _context.Tenants
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Room)
                    .Where(t => t.IsActive)
                    .ToListAsync();

                var overdueTenants = tenants
                    .Where(t => t.IsOverdue)
                    .OrderByDescending(t => t.DaysSinceLastPayment)
                    .Select(ToDto)
                    .ToList();

                return (true, "Overdue tenants retrieved successfully", overdueTenants, null);
            }
            catch (Exception ex)
            {
                return (false, "Error retrieving overdue tenants", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> CreateTenantAsync(int userId, CreateTenantDto dto)
        {
            try
            {
                // Verify room exists and belongs to user
                var room = await _context.Rooms
                    .Where(r => r.UserId == userId)
                    .Include(r => r.Tenants.Where(t => t.IsActive))
                    .FirstOrDefaultAsync(r => r.Id == dto.RoomId);

                if (room == null)
                    return (false, "Room not found", null, new List<string> { "Room does not exist" });

                // Check capacity
                var activeTenantCount = room.Tenants.Count(t => t.IsActive);
                if (activeTenantCount >= room.TotalBeds)
                    return (false, "Room is full", null, new List<string> { $"Room is at full capacity ({activeTenantCount}/{room.TotalBeds} beds occupied)" });

                var tenant = new Tenant
                {
                    UserId = userId,
                    Name = dto.Name,
                    PhoneNumber = dto.PhoneNumber,
                    RoomId = dto.RoomId,
                    AdvanceAmount = dto.AdvanceAmount,
                    JoinDate = dto.JoinDate,
                    LastPaidDate = dto.LastPaidDate,
                    IsActive = dto.IsActive,
                    DueAmount = dto.DueAmount,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Tenants.Add(tenant);
                await _context.SaveChangesAsync();

                // Reload to get room info
                await _context.Entry(tenant).Reference(t => t.Room).LoadAsync();

                return (true, "Tenant created successfully", ToDto(tenant), null);
            }
            catch (Exception ex)
            {
                return (false, "Error creating tenant", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> UpdateTenantAsync(int userId, int id, UpdateTenantDto dto)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Room)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tenant == null)
                    return (false, "Tenant not found", null, new List<string> { "Tenant does not exist" });

                var oldRoomId = tenant.RoomId;
                var wasActive = tenant.IsActive;

                // Handle room change
                if (dto.RoomId.HasValue && dto.RoomId.Value != tenant.RoomId)
                {
                    var newRoom = await _context.Rooms
                        .Include(r => r.Tenants.Where(t => t.IsActive))
                        .FirstOrDefaultAsync(r => r.Id == dto.RoomId.Value);

                    if (newRoom == null)
                        return (false, "New room not found", null, new List<string> { "New room does not exist" });

                    var newRoomActiveTenants = newRoom.Tenants.Count(t => t.IsActive);
                    if (newRoomActiveTenants >= newRoom.TotalBeds)
                        return (false, "New room is full", null, new List<string> { $"New room is at full capacity ({newRoomActiveTenants}/{newRoom.TotalBeds} beds occupied)" });

                    var oldRoom = await _context.Rooms.FindAsync(oldRoomId);
                    if (oldRoom != null && tenant.IsActive)
                    {
                        oldRoom.OccupiedBeds--;
                        oldRoom.UpdatedAt = DateTime.UtcNow;
                    }

                    if (tenant.IsActive)
                    {
                        newRoom.OccupiedBeds++;
                        newRoom.UpdatedAt = DateTime.UtcNow;
                    }

                    tenant.RoomId = dto.RoomId.Value;
                }

                // Handle IsActive change
                if (dto.IsActive.HasValue && dto.IsActive.Value != wasActive)
                {
                    var room = await _context.Rooms.FindAsync(tenant.RoomId);
                    if (room != null)
                    {
                        if (dto.IsActive.Value && !wasActive)
                        {
                            if (room.OccupiedBeds >= room.TotalBeds)
                                return (false, "Room is full", null, new List<string> { "Cannot activate tenant - no available beds" });
                            room.OccupiedBeds++;
                        }
                        else if (!dto.IsActive.Value && wasActive)
                        {
                            room.OccupiedBeds--;
                        }
                        room.UpdatedAt = DateTime.UtcNow;
                    }
                    tenant.IsActive = dto.IsActive.Value;
                }

                if (!string.IsNullOrWhiteSpace(dto.Name))
                    tenant.Name = dto.Name;

                if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
                    tenant.PhoneNumber = dto.PhoneNumber;

                if (dto.AdvanceAmount.HasValue)
                    tenant.AdvanceAmount = dto.AdvanceAmount.Value;

                if (dto.JoinDate.HasValue)
                    tenant.JoinDate = dto.JoinDate.Value;

                if (dto.LastPaidDate.HasValue)
                {
                    if (tenant.LastPaidDate != dto.LastPaidDate.Value)
                        tenant.DueAmount = 0;
                    tenant.LastPaidDate = dto.LastPaidDate.Value;
                }

                if (dto.DueAmount.HasValue)
                    tenant.DueAmount = dto.DueAmount.Value;

                tenant.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await _context.Entry(tenant).Reference(t => t.Room).LoadAsync();

                return (true, "Tenant updated successfully", ToDto(tenant), null);
            }
            catch (Exception ex)
            {
                return (false, "Error updating tenant", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> UpdatePaymentAsync(int userId, int id, UpdatePaymentDto updatePaymentDto)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Room)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tenant == null)
                    return (false, "Tenant not found", null, new List<string> { "Tenant does not exist" });

                if (updatePaymentDto.PaidAmount <= 0)
                    return (false, "Invalid payment", null, new List<string> { "Payment amount must be greater than 0" });

                var totalDueBeforePayment = tenant.CurrentDue;

                if (updatePaymentDto.PaidAmount > totalDueBeforePayment)
                    return (false, "Overpayment not allowed", null,
                        new List<string> { $"Payment amount (₹{updatePaymentDto.PaidAmount}) cannot exceed current due (₹{totalDueBeforePayment})" });

                tenant.LastPaidDate = updatePaymentDto.PaymentDate;
                tenant.DueAmount = totalDueBeforePayment - updatePaymentDto.PaidAmount;
                tenant.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return (true, "Payment updated successfully", ToDto(tenant), null);
            }
            catch (Exception ex)
            {
                return (false, "Error updating payment", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, List<string>? Errors)> DeleteTenantAsync(int userId, int id)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Room)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tenant == null)
                    return (false, "Tenant not found", new List<string> { "Tenant does not exist" });

                if (tenant.IsActive)
                {
                    var room = await _context.Rooms.FindAsync(tenant.RoomId);
                    if (room != null)
                    {
                        room.OccupiedBeds--;
                        room.UpdatedAt = DateTime.UtcNow;
                    }
                }

                _context.Tenants.Remove(tenant);
                await _context.SaveChangesAsync();

                return (true, "Tenant deleted successfully", null);
            }
            catch (Exception ex)
            {
                return (false, "Error deleting tenant", new List<string> { ex.Message });
            }
        }
    }
}