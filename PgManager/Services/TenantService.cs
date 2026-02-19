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

                // Search by name or phone number
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(t => t.Name.Contains(searchTerm) || t.PhoneNumber.Contains(searchTerm));
                }

                // Filter by sharing type
                if (sharingType.HasValue)
                {
                    query = query.Where(t => (int)t.SharingType == sharingType.Value);
                }

                // Filter by active status
                if (isActive.HasValue)
                {
                    query = query.Where(t => t.IsActive == isActive.Value);
                }

                var tenants = await query.ToListAsync();

                // Sort: Active tenants first, then by due amount descending (highest due first)
                var sortedTenants = tenants
                    .OrderByDescending(t => t.IsActive)
                    .ThenByDescending(t => t.DueAmount)
                    .ToList();

                var tenantDtos = sortedTenants.Select(t => new TenantDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    PhoneNumber = t.PhoneNumber,
                    SharingType = t.SharingType.ToString(),
                    RoomId = t.RoomId,
                    RoomNumber = t.Room?.RoomNumber ?? 0,
                    RentAmount = t.RentAmount,
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
                }).ToList();

                return (true, "Tenants retrieved successfully", tenantDtos, null);
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
                {
                    return (false, "Tenant not found", null, new List<string> { "Tenant does not exist" });
                }

                var tenantDto = new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name,
                    PhoneNumber = tenant.PhoneNumber,
                    SharingType = tenant.SharingType.ToString(),
                    RoomId = tenant.RoomId,
                    RoomNumber = tenant.Room?.RoomNumber ?? 0,
                    RentAmount = tenant.RentAmount,
                    AdvanceAmount = tenant.AdvanceAmount,
                    JoinDate = tenant.JoinDate,
                    LastPaidDate = tenant.LastPaidDate,
                    IsActive = tenant.IsActive,
                    DaysSinceLastPayment = tenant.DaysSinceLastPayment,
                    IsOverdue = tenant.IsOverdue,
                    DueAmount = tenant.DueAmount,
                    CurrentDue = tenant.CurrentDue,
                    MonthsElapsed = tenant.MonthsElapsed,
                    CreatedAt = tenant.CreatedAt
                };

                return (true, "Tenant retrieved successfully", tenantDto, null);
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

                // Filter overdue tenants and sort by days overdue
                var overdueTenants = tenants
                    .Where(t => t.IsOverdue)
                    .OrderByDescending(t => t.DaysSinceLastPayment)
                    .Select(t => new TenantDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        PhoneNumber = t.PhoneNumber,
                        SharingType = t.SharingType.ToString(),
                        RoomId = t.RoomId,
                        RoomNumber = t.Room?.RoomNumber ?? 0,
                        RentAmount = t.RentAmount,
                        AdvanceAmount = t.AdvanceAmount,
                        JoinDate = t.JoinDate,
                        LastPaidDate = t.LastPaidDate,
                        IsActive = t.IsActive,
                        DaysSinceLastPayment = t.DaysSinceLastPayment,
                        IsOverdue = t.IsOverdue,
                        DueAmount = t.DueAmount,
                        CreatedAt = t.CreatedAt
                    })
                    .ToList();

                return (true, "Overdue tenants retrieved successfully", overdueTenants, null);
            }
            catch (Exception ex)
            {
                return (false, "Error retrieving overdue tenants", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> CreateTenantAsync(int userId, CreateTenantDto createTenantDto)
        {
            try
            {
                // Verify room exists and belongs to user
                var room = await _context.Rooms
                    .Where(r => r.UserId == userId)
                    .Include(r => r.Tenants.Where(t => t.IsActive))
                    .FirstOrDefaultAsync(r => r.Id == createTenantDto.RoomId);

                if (room == null)
                {
                    return (false, "Room not found", null, new List<string> { "Room does not exist" });
                }

                // Check if room has available beds
                if (room.OccupiedBeds >= room.TotalBeds)
                {
                    return (false, "Room is full", null, new List<string> { "No available beds in this room" });
                }

                // Verify sharing type matches room
                if ((int)room.SharingType != createTenantDto.SharingType)
                {
                    return (false, "Sharing type mismatch", null,
                        new List<string> { $"Room sharing type is {room.SharingType}" });
                }

                var tenant = new Tenant
                {
                    UserId = userId,
                    Name = createTenantDto.Name,
                    PhoneNumber = createTenantDto.PhoneNumber,
                    SharingType = (SharingType)createTenantDto.SharingType,
                    RoomId = createTenantDto.RoomId,
                    RentAmount = createTenantDto.RentAmount,
                    AdvanceAmount = createTenantDto.AdvanceAmount,
                    JoinDate = createTenantDto.JoinDate,
                    LastPaidDate = createTenantDto.LastPaidDate ?? new DateTime(2026, 1, 1),
                    IsActive = createTenantDto.IsActive,
                    DueAmount = createTenantDto.DueAmount,
                    CreatedAt = DateTime.UtcNow
                };
                
                _context.Tenants.Add(tenant);
                await _context.SaveChangesAsync();

                // Reload to get updated room info
                await _context.Entry(tenant).Reference(t => t.Room).LoadAsync();

                var tenantDto = new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name,
                    PhoneNumber = tenant.PhoneNumber,
                    SharingType = tenant.SharingType.ToString(),
                    RoomId = tenant.RoomId,
                    RoomNumber = tenant.Room.RoomNumber,
                    RentAmount = tenant.RentAmount,
                    AdvanceAmount = tenant.AdvanceAmount,
                    JoinDate = tenant.JoinDate,
                    LastPaidDate = tenant.LastPaidDate,
                    IsActive = tenant.IsActive,
                    DaysSinceLastPayment = tenant.DaysSinceLastPayment,
                    IsOverdue = tenant.IsOverdue,
                    DueAmount = tenant.DueAmount,
                    CurrentDue = tenant.CurrentDue,
                    MonthsElapsed = tenant.MonthsElapsed,
                    CreatedAt = tenant.CreatedAt
                };

                return (true, "Tenant updated successfully", tenantDto, null);
            }
            catch (Exception ex)
            {
                return (false, "Error updating tenant", null, new List<string> { ex.Message });
            }
        }

        public async Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> UpdateTenantAsync(int userId, int id, UpdateTenantDto updateTenantDto)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Room)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (tenant == null)
                {
                    return (false, "Tenant not found", null, new List<string> { "Tenant does not exist" });
                }

                var oldRoomId = tenant.RoomId;
                var wasActive = tenant.IsActive;

                // Handle room change
                if (updateTenantDto.RoomId.HasValue && updateTenantDto.RoomId.Value != tenant.RoomId)
                {
                    var newRoom = await _context.Rooms
                        .Include(r => r.Tenants.Where(t => t.IsActive))
                        .FirstOrDefaultAsync(r => r.Id == updateTenantDto.RoomId.Value);

                    if (newRoom == null)
                    {
                        return (false, "New room not found", null, new List<string> { "New room does not exist" });
                    }

                    if (newRoom.OccupiedBeds >= newRoom.TotalBeds)
                    {
                        return (false, "New room is full", null, new List<string> { "No available beds in the new room" });
                    }

                    // Update old room
                    var oldRoom = await _context.Rooms.FindAsync(oldRoomId);
                    if (oldRoom != null && tenant.IsActive)
                    {
                        oldRoom.OccupiedBeds--;
                        oldRoom.UpdatedAt = DateTime.UtcNow;
                    }

                    // Update new room
                    if (tenant.IsActive)
                    {
                        newRoom.OccupiedBeds++;
                        newRoom.UpdatedAt = DateTime.UtcNow;
                    }

                    tenant.RoomId = updateTenantDto.RoomId.Value;
                }

                // Handle IsActive change
                if (updateTenantDto.IsActive.HasValue && updateTenantDto.IsActive.Value != wasActive)
                {
                    var room = await _context.Rooms.FindAsync(tenant.RoomId);
                    if (room != null)
                    {
                        if (updateTenantDto.IsActive.Value && !wasActive)
                        {
                            // Activating tenant
                            if (room.OccupiedBeds >= room.TotalBeds)
                            {
                                return (false, "Room is full", null,
                                    new List<string> { "Cannot activate tenant - no available beds" });
                            }
                            room.OccupiedBeds++;
                        }
                        else if (!updateTenantDto.IsActive.Value && wasActive)
                        {
                            // Deactivating tenant
                            room.OccupiedBeds--;
                        }
                        room.UpdatedAt = DateTime.UtcNow;
                    }
                    tenant.IsActive = updateTenantDto.IsActive.Value;
                }

                // Update other fields
                if (!string.IsNullOrWhiteSpace(updateTenantDto.Name))
                {
                    tenant.Name = updateTenantDto.Name;
                }

                if (!string.IsNullOrWhiteSpace(updateTenantDto.PhoneNumber))
                {
                    tenant.PhoneNumber = updateTenantDto.PhoneNumber;
                }

                if (updateTenantDto.RentAmount.HasValue)
                {
                    tenant.RentAmount = updateTenantDto.RentAmount.Value;
                }

                if (updateTenantDto.AdvanceAmount.HasValue)
                {
                    tenant.AdvanceAmount = updateTenantDto.AdvanceAmount.Value;
                }

                if (updateTenantDto.LastPaidDate.HasValue)
                {
                    // If date changed, reset the stored due amount so calculation starts fresh from this new date
                    if (tenant.LastPaidDate != updateTenantDto.LastPaidDate.Value)
                    {
                        tenant.DueAmount = 0;
                    }
                    tenant.LastPaidDate = updateTenantDto.LastPaidDate.Value;
                }

                if (updateTenantDto.DueAmount.HasValue)
                {
                    tenant.DueAmount = updateTenantDto.DueAmount.Value;
                }

                tenant.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Reload to get updated room info
                await _context.Entry(tenant).Reference(t => t.Room).LoadAsync();

                var tenantDto = new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name,
                    PhoneNumber = tenant.PhoneNumber,
                    SharingType = tenant.SharingType.ToString(),
                    RoomId = tenant.RoomId,
                    RoomNumber = tenant.Room.RoomNumber,
                    RentAmount = tenant.RentAmount,
                    AdvanceAmount = tenant.AdvanceAmount,
                    JoinDate = tenant.JoinDate,
                    LastPaidDate = tenant.LastPaidDate,
                    IsActive = tenant.IsActive,
                    DaysSinceLastPayment = tenant.DaysSinceLastPayment,
                    IsOverdue = tenant.IsOverdue,
                    DueAmount = tenant.DueAmount,
                    CurrentDue = tenant.CurrentDue,
                    MonthsElapsed = tenant.MonthsElapsed,
                    CreatedAt = tenant.CreatedAt
                };

                return (true, "Tenant updated successfully", tenantDto, null);
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
                {
                    return (false, "Tenant not found", null, new List<string> { "Tenant does not exist" });
                }

                // Capture current total due before updating any dates
                // CurrentDue includes both stored DueAmount and time-based rent
                var totalDueBeforePayment = tenant.CurrentDue;

                tenant.LastPaidDate = updatePaymentDto.PaymentDate;
                tenant.DueAmount = totalDueBeforePayment - updatePaymentDto.PaidAmount;
                tenant.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var tenantDto = new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name,
                    PhoneNumber = tenant.PhoneNumber,
                    SharingType = tenant.SharingType.ToString(),
                    RoomId = tenant.RoomId,
                    RoomNumber = tenant.Room.RoomNumber,
                    RentAmount = tenant.RentAmount,
                    AdvanceAmount = tenant.AdvanceAmount,
                    JoinDate = tenant.JoinDate,
                    LastPaidDate = tenant.LastPaidDate,
                    IsActive = tenant.IsActive,
                    DaysSinceLastPayment = tenant.DaysSinceLastPayment,
                    IsOverdue = tenant.IsOverdue,
                    DueAmount = tenant.DueAmount,
                    CurrentDue = tenant.CurrentDue,
                    MonthsElapsed = tenant.MonthsElapsed,
                    CreatedAt = tenant.CreatedAt
                };

                return (true, "Payment updated successfully", tenantDto, null);
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
                {
                    return (false, "Tenant not found", new List<string> { "Tenant does not exist" });
                }

                // Update room occupied beds if tenant was active
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