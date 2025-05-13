using DotLearn.Server.Models;

namespace DotLearn.Server.Data.Repositories
{
    public interface ICourseRepository : IRepository<Course>
    {
        Task<Course> GetCourseWithDetailsAsync(int id);
        Task<IEnumerable<Course>> GetCoursesByInstructorIdAsync(int instructorId);
        Task<int> GetEnrollmentCountAsync(int courseId);
        Task<bool> IsCourseInstructorAsync(int courseId, int userId);
        Task<IEnumerable<Course>> GetCourseDetailsForStudentsAsync(int courseId);
    }
}