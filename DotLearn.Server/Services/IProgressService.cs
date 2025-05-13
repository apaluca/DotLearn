using DotLearn.Server.DTOs.Progress;

namespace DotLearn.Server.Services
{
    public interface IProgressService
    {
        Task<CourseProgressDto> GetCourseProgressAsync(int courseId, int userId, string userRole);
        Task<IEnumerable<CourseProgressDto>> GetProgressOverviewAsync(int userId);
        Task StartLessonAsync(MarkLessonCompleteDto dto, int userId, string userRole);
        Task CompleteLessonAsync(MarkLessonCompleteDto dto, int userId, string userRole);
        Task UncompleteLessonAsync(MarkLessonCompleteDto dto, int userId, string userRole);
    }
}