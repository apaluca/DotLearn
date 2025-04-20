namespace DotLearn.Server.DTOs.Modules
{
    public class ModuleDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int CourseId { get; set; }
        public int OrderIndex { get; set; }
        public int LessonCount { get; set; }
    }
}
