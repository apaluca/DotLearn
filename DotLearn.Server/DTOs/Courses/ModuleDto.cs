namespace DotLearn.Server.DTOs.Courses
{
    public class ModuleDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int OrderIndex { get; set; }
        public List<LessonDto> Lessons { get; set; } = new List<LessonDto>();
    }
}
