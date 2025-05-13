using DotLearn.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Data.Repositories
{
    public class ModuleRepository : Repository<Module>, IModuleRepository
    {
        public ModuleRepository(LmsDbContext context) : base(context) { }

        public async Task<Module> GetModuleWithDetailsAsync(int id)
        {
            return await _context.Modules
                .Include(m => m.Course)
                .Include(m => m.Lessons.OrderBy(l => l.OrderIndex))
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Module>> GetModulesByCourseIdAsync(int courseId)
        {
            return await _context.Modules
                .Where(m => m.CourseId == courseId)
                .OrderBy(m => m.OrderIndex)
                .ToListAsync();
        }

        public async Task<int> GetLessonCountAsync(int moduleId)
        {
            return await _context.Lessons
                .CountAsync(l => l.ModuleId == moduleId);
        }

        public async Task ReorderModulesAsync(int courseId, int moduleId, int oldIndex, int newIndex)
        {
            if (oldIndex == newIndex)
                return;

            var modules = await _context.Modules
                .Where(m => m.CourseId == courseId && m.Id != moduleId)
                .OrderBy(m => m.OrderIndex)
                .ToListAsync();

            // Insert at the new index and shift others
            if (oldIndex < newIndex)
            {
                // Moving down - shift modules up
                foreach (var m in modules)
                {
                    if (m.OrderIndex > oldIndex && m.OrderIndex <= newIndex)
                    {
                        m.OrderIndex--;
                    }
                }
            }
            else
            {
                // Moving up - shift modules down
                foreach (var m in modules)
                {
                    if (m.OrderIndex >= newIndex && m.OrderIndex < oldIndex)
                    {
                        m.OrderIndex++;
                    }
                }
            }

            // Update the module being reordered
            var module = await _dbSet.FindAsync(moduleId);
            if (module != null)
            {
                module.OrderIndex = newIndex;
            }

            await _context.SaveChangesAsync();
        }
    }
}