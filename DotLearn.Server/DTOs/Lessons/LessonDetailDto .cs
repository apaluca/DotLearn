namespace DotLearn.Server.DTOs.Lessons
{
    public class LessonDetailDto : LessonDto
    {
        public string Content { get; set; }
        public string ModuleTitle { get; set; }
        public int CourseId { get; set; }
        public string CourseTitle { get; set; }
    }
}
