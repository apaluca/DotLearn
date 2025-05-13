using DotLearn.Server.Domain.Entities;

namespace DotLearn.Server.Data.Repositories
{
    public interface IModuleRepository : IRepository<Module>
    {
        Task<Module> GetModuleWithDetailsAsync(int id);
        Task<IEnumerable<Module>> GetModulesByCourseIdAsync(int courseId);
        Task<int> GetLessonCountAsync(int moduleId);
        Task ReorderModulesAsync(int courseId, int moduleId, int oldIndex, int newIndex);
    }
}