using DotLearn.Server.DTOs.Enrollments;

namespace DotLearn.Server.Services
{
    public interface IEnrollmentService
    {
        Task<IEnumerable<EnrollmentDto>> GetEnrollmentsAsync(int userId, string userRole);
        Task<IEnumerable<CourseDto>> GetEnrolledCoursesAsync(int userId);
        Task<EnrollmentDto> EnrollInCourseAsync(EnrollCourseDto enrollDto, int userId);
        Task UpdateEnrollmentStatusAsync(int id, UpdateEnrollmentDto updateDto, int userId, string userRole);
        Task DeleteEnrollmentAsync(int id, int userId, string userRole);
        Task<EnrollmentDto> AdminEnrollStudentAsync(AdminEnrollDto enrollDto);
        Task AdminUnenrollStudentAsync(AdminEnrollDto unenrollDto);
    }
}