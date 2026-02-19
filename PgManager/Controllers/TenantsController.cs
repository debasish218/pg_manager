using Microsoft.AspNetCore.Mvc;
using PgManager.DTOs.Tenant;
using PgManager.Services.Interfaces;

namespace PgManager.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantsController : BaseApiController
    {
        private readonly ITenantService _tenantService;

        public TenantsController(ITenantService tenantService)
        {
            _tenantService = tenantService;
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

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _tenantService.CreateTenantAsync(userId, createTenantDto);

            if (!result.Success)
                return BadRequest(new { success = result.Success, message = result.Message, errors = result.Errors });

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