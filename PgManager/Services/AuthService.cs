using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OtpNet;
using PgManager.Entities;

namespace PgManager.Services
{
    public class AuthService
    {
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (string secret, string qrCodeUri) GenerateSetupCode(string phoneNumber)
        {
            var key = KeyGeneration.GenerateRandomKey(20);
            var base32String = Base32Encoding.ToString(key);
            
            // Format: otpauth://totp/{label}?secret={secret}&issuer={issuer}
            var label = $"PgManager:{phoneNumber}";
            var issuer = "PgManager";
            var qrCodeUri = $"otpauth://totp/{label}?secret={base32String}&issuer={issuer}";

            return (base32String, qrCodeUri);
        }

        public bool VerifyCode(string secret, string code)
        {
            if (string.IsNullOrEmpty(secret)) return false;
            
            var bytes = Base32Encoding.ToBytes(secret);
            var totp = new Totp(bytes);
            
            // Verify with a window of 2 steps (30 seconds before and after) to account for time drift
            return totp.VerifyTotp(code, out _, new VerificationWindow(2, 2));
        }

        public string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]);

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.MobilePhone, user.PhoneNumber),
                    new Claim(ClaimTypes.GivenName, user.Name ?? ""),
                    new Claim("pgname", user.PgName),
                    new Claim(ClaimTypes.Role, user.Role)
                }),
                // Long-lived token for "memorized session" - e.g., 365 days
                Expires = DateTime.UtcNow.AddDays(365), 
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
