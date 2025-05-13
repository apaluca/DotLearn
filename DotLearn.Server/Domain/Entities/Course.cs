namespace DotLearn.Server.Domain.Entities
{
    public class Course
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int InstructorId { get; set; }
        public User Instructor { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public ICollection<Module> Modules { get; set; } = new List<Module>();
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
