namespace DotLearn.Server.DTOs.Progress
{
    public class LessonProgressDto
    {
        public int LessonId { get; set; }
        public string LessonTitle { get; set; }
        public string ModuleTitle { get; set; }
        public int ModuleId { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public bool IsCompleted { get; set; }
    }
}
