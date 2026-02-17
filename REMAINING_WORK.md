# Remaining Work for Multi-Tenant Isolation

## ✅ COMPLETED
- Database schema updated (UserId in Rooms & Tenants)
- Entities updated (Tenant.cs, Room.cs have UserId property)
- All existing data assigned to UserId=1

## ⏳ NEED TO UPDATE

### Services Need UserId Parameter

**TenantService.cs** - Add userId parameter to methods:
```csharp
// In GetAllTenantsAsync:
var query = _context.Tenants
    .Where(t => t.UserId == userId)  // ADD THIS LINE
    .Include(t => t.Room);

// In CreateTenantAsync:
tenant.UserId = userId;  // ADD THIS LINE before _context.Tenants.Add(tenant)
```

**RoomService.cs** - Add userId parameter to methods:
```csharp
// In GetAllRoomsAsync:
var query = _context.Rooms
    .Where(r => r.UserId == userId)  // ADD THIS LINE
    .Include(r => r.Tenants);

// In CreateRoomAsync:
room.UserId = userId;  // ADD THIS LINE before _context.Rooms.Add(room)
```

### Controllers Need to Pass UserId

**TenantsController.cs & RoomsController.cs:**
```csharp
// At top of class:
private int GetCurrentUserId()
{
    var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type == ClaimTypes.NameIdentifier);
    return int.Parse(userIdClaim?.Value ?? "0");
}

// In GetAllTenants:
var userId = GetCurrentUserId();
var result = await _tenantService.GetAllTenantsAsync(userId, searchTerm, sharingType, isActive);
```

## QUICK TEST
1. Login with phone A → Create room/tenant
2. Login with phone B → Should see empty list (not phone A's data!)

## CURRENT BLOCKER
"Users table not found" error - needs backend restart after migration.
