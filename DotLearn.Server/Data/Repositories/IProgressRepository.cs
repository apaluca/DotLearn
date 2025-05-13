using DotLearn.Server.Domain.Entities;

namespace DotLearn.Server.Data.Repositories
{
    public interface IProgressRepository : IRepository<LessonProgress>
    {
        Task<LessonProgress?> GetProgressByUserAndLessonAsync(int userId, int lessonId);
        Task<IEnumerable<LessonProgress>> GetProgressByUserAndCourseAsync(int userId, int courseId);
        Task<IEnumerable<LessonProgress>> GetProgressByLessonAsync(int lessonId);
        Task<int> GetCompletedLessonsCountAsync(int userId, int courseId);
        Task<int> GetCompletedLessonsCountForModuleAsync(int userId, int moduleId);
        Task<bool> HasCompletedAllLessonsInCourseAsync(int userId, int courseId);
    }
}