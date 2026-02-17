using Microsoft.AspNetCore.Mvc;
using PgManager.DTOs.Tenant;
using PgManager.Services.Interfaces;

namespace PgManager.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantsController : ControllerBase
    {
        private readonly ITenantService _tenantService;

        public TenantsController(ITenantService tenantService)
        {
            _tenantService = tenantService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return 0; // Will cause authorization failures in service layer
            }
            return userId;
        }

        /// <summary>
        /// Get all tenants with optional filters
        /// Sorted by overdue days (most overdue first)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllTenants(
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? sharingType = null,
            [FromQuery] bool? isActive = null)
        {
            var userId = GetCurrentUserId();
            var result = await _tenantService.GetAllTenantsAsync(userId, searchTerm, sharingType, isActive);

            if (!result.Success){
                Console.WriteLine($"Error fetching tenants: {result.Message}");
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });
            }


            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Get tenant by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTenantById(int id)
        {
            var userId = GetCurrentUserId();
            var result = await _tenantService.GetTenantByIdAsync(userId, id);

            if (!result.Success)
                return NotFound(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Get overdue tenants sorted by most overdue first
        /// </summary>
        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueTenants()
        {
            var userId = GetCurrentUserId();
            var result = await _tenantService.GetOverdueTenantsAsync(userId);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Create a new tenant
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto createTenantDto)
        {
            Console.WriteLine("=== CREATE TENANT REQUEST ===");
            Console.WriteLine($"Received payload: Name={createTenantDto?.Name}, Phone={createTenantDto?.PhoneNumber}, SharingType={createTenantDto?.SharingType}, RoomId={createTenantDto?.RoomId}, RentAmount={createTenantDto?.RentAmount}, AdvanceAmount={createTenantDto?.AdvanceAmount}, JoinDate={createTenantDto?.JoinDate}, DueAmount={createTenantDto?.DueAmount}");
            
            if (!ModelState.IsValid)
            {
                Console.WriteLine("=== VALIDATION FAILED ===");
                foreach (var error in ModelState)
                {
                    Console.WriteLine($"Field: {error.Key}");
                    foreach (var err in error.Value.Errors)
                    {
                        Console.WriteLine($"  Error: {err.ErrorMessage}");
                        if (err.Exception != null)
                            Console.WriteLine($"  Exception: {err.Exception.Message}");
                    }
                }
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            var result = await _tenantService.CreateTenantAsync(userId, createTenantDto);

            if (!result.Success)
            {
                Console.WriteLine($"=== SERVICE ERROR: {result.Message} ===");
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });
            }

            Console.WriteLine($"=== TENANT CREATED SUCCESSFULLY: ID={result.Data.Id} ===");
            return CreatedAtAction(nameof(GetTenantById),
                new { id = result.Data.Id },
                new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Update an existing tenant
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTenant(int id, [FromBody] UpdateTenantDto updateTenantDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _tenantService.UpdateTenantAsync(userId, id, updateTenantDto);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Update tenant payment (mark rent as paid)
        /// </summary>
        [HttpPatch("{id}/payment")]
        public async Task<IActionResult> UpdatePayment(int id, [FromBody] UpdatePaymentDto updatePaymentDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _tenantService.UpdatePaymentAsync(userId, id, updatePaymentDto);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message, data = result.Data });
        }

        /// <summary>
        /// Delete a tenant
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(int id)
        {
            var userId = GetCurrentUserId();
            var result = await _tenantService.DeleteTenantAsync(userId, id);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

            return Ok(new { success = result.Success, message = result.Message });
        }
    }
}