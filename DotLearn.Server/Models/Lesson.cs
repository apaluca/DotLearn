namespace DotLearn.Server.Models
{
    public class Lesson
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public int ModuleId { get; set; }
        public Module Module { get; set; }
        public int OrderIndex { get; set; }
        public LessonType Type { get; set; }
    }
}
