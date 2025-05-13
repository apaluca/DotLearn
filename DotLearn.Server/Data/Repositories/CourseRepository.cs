using DotLearn.Server.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Data.Repositories
{
    public class CourseRepository : Repository<Course>, ICourseRepository
    {
        public CourseRepository(LmsDbContext context) : base(context) { }

        public async Task<Course?> GetCourseWithDetailsAsync(int id)
        {
            return await _context.Courses
                .Include(c => c.Instructor)
                .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
                .ThenInclude(m => m.Lessons.OrderBy(l => l.OrderIndex))
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Course>> GetCoursesByInstructorIdAsync(int instructorId)
        {
            return await _context.Courses
                .Where(c => c.InstructorId == instructorId)
                .Include(c => c.Instructor)
                .ToListAsync();
        }

        public async Task<int> GetEnrollmentCountAsync(int courseId)
        {
            return await _context.Enrollments
                .CountAsync(e => e.CourseId == courseId);
        }

        public async Task<bool> IsCourseInstructorAsync(int courseId, int userId)
        {
            return await _context.Courses
                .AnyAsync(c => c.Id == courseId && c.InstructorId == userId);
        }

        public async Task<IEnumerable<Course>> GetCourseDetailsForStudentsAsync(int courseId)
        {
            return await _context.Courses
                .Where(c => c.Id == courseId)
                .Include(c => c.Instructor)
                .ToListAsync();
        }
    }
}