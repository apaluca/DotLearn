using DotLearn.Server.Domain.Entities;

namespace DotLearn.Server.Data.Repositories
{
    public interface ILessonRepository : IRepository<Lesson>
    {
        Task<Lesson?> GetLessonWithDetailsAsync(int id);
        Task<IEnumerable<Lesson>> GetLessonsByModuleIdAsync(int moduleId);
        Task<Module?> GetModuleWithCourseAsync(int moduleId);
        Task<bool> IsLessonTypeQuizAsync(int lessonId);
        Task ReorderLessonsAsync(int moduleId, int lessonId, int oldIndex, int newIndex);
        Task<List<int>> GetLessonIdsByCourseIdAsync(int courseId);
    }
}