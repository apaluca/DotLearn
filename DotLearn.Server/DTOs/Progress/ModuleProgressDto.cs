namespace DotLearn.Server.DTOs.Progress
{
    public class ModuleProgressDto
    {
        public int ModuleId { get; set; }
        public string ModuleTitle { get; set; }
        public int TotalLessons { get; set; }
        public int CompletedLessons { get; set; }
        public double ProgressPercentage { get; set; }
        public List<LessonProgressDto> Lessons { get; set; } = new List<LessonProgressDto>();
    }
}
