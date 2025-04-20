namespace DotLearn.Server.DTOs.Courses
{
    public class StudentProgressDto
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public string Status { get; set; }
        public DateTime? CompletionDate { get; set; }
        public int TotalLessons { get; set; }
        public int CompletedLessons { get; set; }
        public double ProgressPercentage { get; set; }
    }
}
