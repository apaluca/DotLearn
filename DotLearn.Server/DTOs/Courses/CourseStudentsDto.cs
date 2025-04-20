namespace DotLearn.Server.DTOs.Courses
{
    public class CourseStudentsDto
    {
        public int CourseId { get; set; }
        public string CourseTitle { get; set; }
        public int TotalStudents { get; set; }
        public double AverageProgress { get; set; }
        public double CompletionRate { get; set; }
        public List<StudentProgressDto> Students { get; set; } = new List<StudentProgressDto>();
    }
}
