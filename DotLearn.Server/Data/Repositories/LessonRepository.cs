using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Data.Repositories
{
    public class LessonRepository : Repository<Lesson>, ILessonRepository
    {
        public LessonRepository(LmsDbContext context) : base(context) { }

        public async Task<Lesson> GetLessonWithDetailsAsync(int id)
        {
            return await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                        .ThenInclude(c => c.Instructor)
                .FirstOrDefaultAsync(l => l.Id == id);
        }

        public async Task<IEnumerable<Lesson>> GetLessonsByModuleIdAsync(int moduleId)
        {
            return await _context.Lessons
                .Where(l => l.ModuleId == moduleId)
                .OrderBy(l => l.OrderIndex)
                .ToListAsync();
        }

        public async Task<Module> GetModuleWithCourseAsync(int moduleId)
        {
            return await _context.Modules
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == moduleId);
        }

        public async Task<bool> IsLessonTypeQuizAsync(int lessonId)
        {
            var lesson = await _dbSet.FindAsync(lessonId);
            return lesson != null && lesson.Type == LessonType.Quiz;
        }

        public async Task ReorderLessonsAsync(int moduleId, int lessonId, int oldIndex, int newIndex)
        {
            if (oldIndex == newIndex)
                return;

            var lessons = await _context.Lessons
                .Where(l => l.ModuleId == moduleId && l.Id != lessonId)
                .OrderBy(l => l.OrderIndex)
                .ToListAsync();

            // Insert at the new index and shift others
            if (oldIndex < newIndex)
            {
                // Moving down - shift lessons up
                foreach (var l in lessons)
                {
                    if (l.OrderIndex > oldIndex && l.OrderIndex <= newIndex)
                    {
                        l.OrderIndex--;
                    }
                }
            }
            else
            {
                // Moving up - shift lessons down
                foreach (var l in lessons)
                {
                    if (l.OrderIndex >= newIndex && l.OrderIndex < oldIndex)
                    {
                        l.OrderIndex++;
                    }
                }
            }

            // Update the lesson being reordered
            var lesson = await _dbSet.FindAsync(lessonId);
            if (lesson != null)
            {
                lesson.OrderIndex = newIndex;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<int>> GetLessonIdsByCourseIdAsync(int courseId)
        {
            return await _context.Lessons
                .Join(_context.Modules,
                    l => l.ModuleId,
                    m => m.Id,
                    (l, m) => new { Lesson = l, Module = m })
                .Where(x => x.Module.CourseId == courseId)
                .Select(x => x.Lesson.Id)
                .ToListAsync();
        }
    }
}