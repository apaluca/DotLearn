using DotLearn.Server.Domain.Enums;

namespace DotLearn.Server.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public ICollection<Enrollment> Enrollments { get; set; }
        public ICollection<Course> InstructorCourses { get; set; }
    }
}
