using DotLearn.Server.Domain.Enums;

namespace DotLearn.Server.Domain.Entities
{
    public class Enrollment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public int CourseId { get; set; }
        public Course Course { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public EnrollmentStatus Status { get; set; }
        public DateTime? CompletionDate { get; set; }
    }
}
