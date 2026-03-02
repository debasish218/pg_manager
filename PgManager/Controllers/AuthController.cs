using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PgManager.Data;
using PgManager.DTO;
using PgManager.Entities;
using PgManager.Services;
using Google.Apis.Auth;

namespace PgManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthService _authService;

        public AuthController(ApplicationDbContext context, AuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        [HttpPost("setup")]
        public async Task<IActionResult> Setup([FromBody] SetupRequest request)
        {
            if (string.IsNullOrEmpty(request.PhoneNumber))
                return BadRequest("Phone number is required");
            
            if (string.IsNullOrEmpty(request.PgName))
                return BadRequest("PG name is required");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber);
            if (user == null)
            {
                user = new User { PhoneNumber = request.PhoneNumber, Name = request.Name, PgName = request.PgName };
                _context.Users.Add(user);
            }
            else
            {
                // Update existing user's details
                user.Name = request.Name;
                user.PgName = request.PgName;
            }

            var (secret, qrCodeUri) = _authService.GenerateSetupCode(request.PhoneNumber);
            user.TotpSecret = secret;

            await _context.SaveChangesAsync();

            return Ok(new { Secret = secret, QrCodeUri = qrCodeUri });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber);
            if (user == null)
                return Unauthorized("Invalid phone number or code");

            if (string.IsNullOrEmpty(user.TotpSecret))
                return BadRequest("2FA not set up for this user");

            var isValid = _authService.VerifyCode(user.TotpSecret, request.Code);
            if (!isValid)
                return Unauthorized("Invalid code");

            var token = _authService.GenerateJwtToken(user);
            return Ok(new { Token = token, User = new { user.Id, user.Name, user.Email, user.PhoneNumber, user.PgName, user.Role } });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
                
                if (user == null)
                {
                    user = new User 
                    { 
                        Email = payload.Email, 
                        Name = payload.Name, 
                        PgName = "My PG",
                        PhoneNumber = null 
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
                
                var token = _authService.GenerateJwtToken(user);
                return Ok(new { Token = token, User = new { user.Id, user.Name, user.Email, user.PhoneNumber, user.PgName, user.Role } });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized("Invalid Google token");
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid token");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(new { user.Id, user.Name, user.Email, user.PhoneNumber, user.PgName, user.Role });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid token");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Update profile fields
            user.PgName = request.PgName;
            user.Name = request.Name;

            await _context.SaveChangesAsync();

            return Ok(new { user.Id, user.Name, user.Email, user.PhoneNumber, user.PgName, user.Role });
        }

        [Authorize]
        [HttpDelete("profile")]
        public async Task<IActionResult> DeleteProfile()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid token");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Delete all associated data
            // Delete all tenants for this user
            var tenants = await _context.Tenants.Where(t => t.UserId == userId).ToListAsync();
            _context.Tenants.RemoveRange(tenants);

            // Delete all rooms for this user
            var rooms = await _context.Rooms.Where(r => r.UserId == userId).ToListAsync();
            _context.Rooms.RemoveRange(rooms);

            // Delete the user
            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Profile deleted successfully" });
        }
    }

    public class SetupRequest
    {
        public required string PhoneNumber { get; set; }
        public required string PgName { get; set; }
        public string? Name { get; set; }
    }

    public class LoginRequest
    {
        public string PhoneNumber { get; set; }
        public string Code { get; set; }
    }

    public class GoogleLoginRequest
    {
        public required string IdToken { get; set; }
    }
}
