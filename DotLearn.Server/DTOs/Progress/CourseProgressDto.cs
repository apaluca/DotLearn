namespace DotLearn.Server.DTOs.Progress
{
    public class CourseProgressDto
    {
        public int CourseId { get; set; }
        public string CourseTitle { get; set; }
        public int TotalLessons { get; set; }
        public int CompletedLessons { get; set; }
        public double ProgressPercentage { get; set; }
        public List<ModuleProgressDto> Modules { get; set; } = new List<ModuleProgressDto>();
    }
}
