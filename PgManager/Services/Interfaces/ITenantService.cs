using PgManager.DTOs.Tenant;

namespace PgManager.Services.Interfaces
{
    public interface ITenantService
    {
        Task<(bool Success, string Message, IEnumerable<TenantDto>? Data, List<string>? Errors)> GetAllTenantsAsync(int userId, string? searchTerm = null, int? sharingType = null, bool? isActive = null);
        Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> GetTenantByIdAsync(int userId, int id);
        Task<(bool Success, string Message, IEnumerable<TenantDto>? Data, List<string>? Errors)> GetOverdueTenantsAsync(int userId);
        Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> CreateTenantAsync(int userId, CreateTenantDto createTenantDto);
        Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> UpdateTenantAsync(int userId, int id, UpdateTenantDto updateTenantDto);
        Task<(bool Success, string Message, TenantDto? Data, List<string>? Errors)> UpdatePaymentAsync(int userId, int id, UpdatePaymentDto updatePaymentDto);
        Task<(bool Success, string Message, List<string>? Errors)> DeleteTenantAsync(int userId, int id);
    }
}