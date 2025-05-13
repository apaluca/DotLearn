using DotLearn.Server.DTOs.Lessons;

namespace DotLearn.Server.Services
{
    public interface ILessonService
    {
        Task<IEnumerable<LessonDto>> GetLessonsByModuleIdAsync(int moduleId, int userId, string userRole);
        Task<LessonDetailDto> GetLessonByIdAsync(int id, int userId, string userRole);
        Task<LessonDto> CreateLessonAsync(CreateLessonDto lessonDto, int userId, string userRole);
        Task UpdateLessonAsync(int id, UpdateLessonDto lessonDto, int userId, string userRole);
        Task DeleteLessonAsync(int id, int userId, string userRole);
    }
}