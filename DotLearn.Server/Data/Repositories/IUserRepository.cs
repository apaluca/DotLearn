using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;

namespace DotLearn.Server.Data.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByEmailAsync(string email);
        Task<IEnumerable<User>> GetUsersByRoleAsync(UserRole role);
        Task<bool> IsUsernameUniqueAsync(string username);
        Task<bool> IsEmailUniqueAsync(string email);
        Task<int> GetUserCourseCountAsync(int userId);
        Task<int> GetUserEnrollmentCountAsync(int userId);
    }
}