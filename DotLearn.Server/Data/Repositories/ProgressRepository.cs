using DotLearn.Server.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Data.Repositories
{
    public class ProgressRepository : Repository<LessonProgress>, IProgressRepository
    {
        public ProgressRepository(LmsDbContext context) : base(context) { }

        public async Task<LessonProgress?> GetProgressByUserAndLessonAsync(int userId, int lessonId)
        {
            return await _context.LessonProgress
                .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.LessonId == lessonId);
        }

        public async Task<IEnumerable<LessonProgress>> GetProgressByUserAndCourseAsync(int userId, int courseId)
        {
            return await _context.LessonProgress
                .Include(lp => lp.Lesson)
                    .ThenInclude(l => l.Module)
                .Where(lp => lp.UserId == userId && lp.Lesson.Module.CourseId == courseId)
                .ToListAsync();
        }

        public async Task<IEnumerable<LessonProgress>> GetProgressByLessonAsync(int lessonId)
        {
            return await _context.LessonProgress
                .Where(lp => lp.LessonId == lessonId)
                .ToListAsync();
        }

        public async Task<int> GetCompletedLessonsCountAsync(int userId, int courseId)
        {
            return await _context.LessonProgress
                .Include(lp => lp.Lesson)
                    .ThenInclude(l => l.Module)
                .Where(lp =>
                    lp.UserId == userId &&
                    lp.Lesson.Module.CourseId == courseId &&
                    lp.IsCompleted)
                .CountAsync();
        }

        public async Task<int> GetCompletedLessonsCountForModuleAsync(int userId, int moduleId)
        {
            return await _context.LessonProgress
                .Include(lp => lp.Lesson)
                .Where(lp =>
                    lp.UserId == userId &&
                    lp.Lesson.ModuleId == moduleId &&
                    lp.IsCompleted)
                .CountAsync();
        }

        public async Task<bool> HasCompletedAllLessonsInCourseAsync(int userId, int courseId)
        {
            // Get total lessons in course
            int totalLessons = await _context.Lessons
                .Include(l => l.Module)
                .Where(l => l.Module.CourseId == courseId)
                .CountAsync();

            if (totalLessons == 0)
                return false;

            // Get completed lessons
            int completedLessons = await GetCompletedLessonsCountAsync(userId, courseId);

            // Check if all lessons are completed
            return totalLessons == completedLessons;
        }
    }
}