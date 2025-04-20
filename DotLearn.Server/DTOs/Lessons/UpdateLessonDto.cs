namespace DotLearn.Server.DTOs.Lessons
{
    public class UpdateLessonDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string Type { get; set; }
        public int? OrderIndex { get; set; }
    }
}
