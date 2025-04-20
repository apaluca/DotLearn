namespace DotLearn.Server.DTOs.Enrollments
{
    public class EnrollmentDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public int CourseId { get; set; }
        public string CourseTitle { get; set; }
        public string InstructorName { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public string Status { get; set; }
        public DateTime? CompletionDate { get; set; }
    }
}
