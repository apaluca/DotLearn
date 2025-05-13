using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;
using DotLearn.Server.DTOs.Auth;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace DotLearn.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUserRepository userRepository,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthResultDto> LoginAsync(LoginModel model)
        {
            if (string.IsNullOrEmpty(model.Username))
            {
                throw new BadRequestException("Username is required");
            }

            if (string.IsNullOrEmpty(model.Password))
            {
                throw new BadRequestException("Password is required");
            }

            var user = await _userRepository.GetUserByUsernameAsync(model.Username);

            if (user == null || !VerifyPassword(model.Password, user.PasswordHash))
            {
                throw new UnauthorizedException("Invalid username or password");
            }

            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role.ToString()
                }
            };
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterModel model)
        {
            // Validate input
            if (string.IsNullOrEmpty(model.Username))
            {
                throw new BadRequestException("Username is required");
            }

            if (string.IsNullOrEmpty(model.Email))
            {
                throw new BadRequestException("Email is required");
            }

            if (string.IsNullOrEmpty(model.Password))
            {
                throw new BadRequestException("Password is required");
            }

            // Check if username exists
            if (!await _userRepository.IsUsernameUniqueAsync(model.Username))
            {
                throw new BadRequestException("Username already exists");
            }

            // Check if email exists
            if (!await _userRepository.IsEmailUniqueAsync(model.Email))
            {
                throw new BadRequestException("Email already registered");
            }

            var user = new User
            {
                Username = model.Username,
                Email = model.Email,
                PasswordHash = HashPassword(model.Password),
                FirstName = model.FirstName ?? string.Empty,
                LastName = model.LastName ?? string.Empty,
                Role = UserRole.Student, // Default role for new registrations
                CreatedAt = DateTime.Now
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role.ToString()
                }
            };
        }

        public string GenerateJwtToken(User user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user), "User cannot be null");
            }

            var tokenHandler = new JwtSecurityTokenHandler();

            // Get JWT key with null checks
            var keyConfig = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(keyConfig))
            {
                throw new InvalidOperationException("JWT Key is not configured");
            }
            var key = Encoding.ASCII.GetBytes(keyConfig);

            // Check issuer and audience
            var issuer = _configuration["Jwt:Issuer"] ?? "DotLearn.Server";
            var audience = _configuration["Jwt:Audience"] ?? "DotLearn.Client";

            // Parse expiry minutes with default
            var expiryMinStr = _configuration["Jwt:ExpiryMinutes"] ?? "60";
            if (!double.TryParse(expiryMinStr, out var expiryMinutes))
            {
                expiryMinutes = 60; // Default to 60 minutes if parsing fails
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
                Issuer = issuer,
                Audience = audience
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Password cannot be null or empty", nameof(password));
            }

            // Generate a random salt
            byte[] salt = new byte[128 / 8];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password with the salt
            string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));

            // Combine the salt and hash for storage
            return $"{Convert.ToBase64String(salt)}:{hashed}";
        }

        public bool VerifyPassword(string password, string? storedHash)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(storedHash))
            {
                return false;
            }

            // Extract the salt and hash from the stored value
            var parts = storedHash.Split(':');
            if (parts.Length != 2)
                return false;

            var salt = Convert.FromBase64String(parts[0]);
            var hash = parts[1];

            // Hash the provided password with the extracted salt
            string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));

            // Compare the computed hash with the stored hash
            return hash == hashed;
        }
    }
}