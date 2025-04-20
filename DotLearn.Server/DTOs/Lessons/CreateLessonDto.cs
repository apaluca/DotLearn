namespace DotLearn.Server.DTOs.Lessons
{
    public class CreateLessonDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public int ModuleId { get; set; }
        public string Type { get; set; }
    }
}
