using DotLearn.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Data.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(LmsDbContext context) : base(context) { }

        public async Task<User> GetUserByUsernameAsync(string username)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<User>> GetUsersByRoleAsync(UserRole role)
        {
            return await _context.Users
                .Where(u => u.Role == role)
                .ToListAsync();
        }

        public async Task<bool> IsUsernameUniqueAsync(string username)
        {
            return !await _context.Users.AnyAsync(u => u.Username == username);
        }

        public async Task<bool> IsEmailUniqueAsync(string email)
        {
            return !await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<int> GetUserCourseCountAsync(int userId)
        {
            return await _context.Courses
                .CountAsync(c => c.InstructorId == userId);
        }

        public async Task<int> GetUserEnrollmentCountAsync(int userId)
        {
            return await _context.Enrollments
                .CountAsync(e => e.UserId == userId);
        }
    }
}