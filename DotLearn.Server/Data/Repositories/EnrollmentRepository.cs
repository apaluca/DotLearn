using DotLearn.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Data.Repositories
{
    public class EnrollmentRepository : Repository<Enrollment>, IEnrollmentRepository
    {
        public EnrollmentRepository(LmsDbContext context) : base(context) { }

        public async Task<Enrollment> GetEnrollmentWithDetailsAsync(int id)
        {
            return await _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<IEnumerable<Enrollment>> GetEnrollmentsByUserIdAsync(int userId)
        {
            return await _context.Enrollments
                .Where(e => e.UserId == userId)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor)
                .ToListAsync();
        }

        public async Task<IEnumerable<Enrollment>> GetEnrollmentsByCourseIdAsync(int courseId)
        {
            return await _context.Enrollments
                .Where(e => e.CourseId == courseId)
                .Include(e => e.User)
                .ToListAsync();
        }

        public async Task<bool> IsUserEnrolledInCourseAsync(int userId, int courseId)
        {
            return await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
        }

        public async Task<IEnumerable<Course>> GetEnrolledCoursesForUserAsync(int userId)
        {
            return await _context.Enrollments
                .Where(e => e.UserId == userId)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor)
                .Select(e => e.Course)
                .ToListAsync();
        }
    }
}