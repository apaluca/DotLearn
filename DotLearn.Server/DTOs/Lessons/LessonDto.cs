namespace DotLearn.Server.DTOs.Lessons
{
    public class LessonDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int ModuleId { get; set; }
        public int OrderIndex { get; set; }
        public string Type { get; set; }
    }
}
