using DotLearn.Server.DTOs.Courses;

namespace DotLearn.Server.Services
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseDto>> GetAllCoursesAsync();
        Task<CourseDetailDto> GetCourseByIdAsync(int id);
        Task<CourseDto> CreateCourseAsync(CreateCourseDto courseDto, int instructorId);
        Task UpdateCourseAsync(int id, UpdateCourseDto courseDto, int userId, string userRole);
        Task DeleteCourseAsync(int id, int userId, string? userRole);
        Task<CourseStudentsDto> GetCourseStudentsAsync(int id, int userId, string userRole);
    }
}