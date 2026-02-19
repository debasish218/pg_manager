using Microsoft.AspNetCore.Mvc;

namespace PgManager.Controllers
{
    /// <summary>
    /// Base controller that provides shared utilities for all API controllers.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        /// <summary>
        /// Extracts the current user's ID from the JWT NameIdentifier claim.
        /// Returns 0 if the claim is missing or invalid, which causes authorization
        /// failures in the service layer (data is scoped per user).
        /// </summary>
        protected int GetCurrentUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(
                c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return 0;

            return userId;
        }
    }
}
