using DotLearn.Server.Domain.Entities;

namespace DotLearn.Server.Data.Repositories
{
    public interface IEnrollmentRepository : IRepository<Enrollment>
    {
        Task<Enrollment?> GetEnrollmentWithDetailsAsync(int id);
        Task<IEnumerable<Enrollment>> GetEnrollmentsByUserIdAsync(int userId);
        Task<IEnumerable<Enrollment>> GetEnrollmentsByCourseIdAsync(int courseId);
        Task<bool> IsUserEnrolledInCourseAsync(int userId, int courseId);
        Task<IEnumerable<Course>> GetEnrolledCoursesForUserAsync(int userId);
    }
}