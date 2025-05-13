using DotLearn.Server.DTOs.Admin;
using DotLearn.Server.DTOs.Auth;

namespace DotLearn.Server.Services
{
    public interface IAdminService
    {
        Task<IEnumerable<UserListDto>> GetUsersAsync();
        Task<UserListDto> GetUserByIdAsync(int id);
        Task UpdateUserAsync(int id, UpdateUserDto updateUserDto);
        Task UpdateUserPasswordAsync(int id, UpdatePasswordDto updatePasswordDto);
        Task DeleteUserAsync(int id, int currentUserId);
        Task<UserListDto> CreateUserAsync(RegisterModel registerModel, string? role);
    }
}