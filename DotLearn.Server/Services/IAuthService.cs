using DotLearn.Server.Domain.Entities;
using DotLearn.Server.DTOs.Auth;

namespace DotLearn.Server.Services
{
    public interface IAuthService
    {
        Task<AuthResultDto> LoginAsync(LoginModel model);
        Task<AuthResultDto> RegisterAsync(RegisterModel model);
        string GenerateJwtToken(User user);
        string HashPassword(string password);
        bool VerifyPassword(string password, string storedHash);
    }
}