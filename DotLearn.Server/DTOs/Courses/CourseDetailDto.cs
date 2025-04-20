namespace DotLearn.Server.DTOs.Courses
{
    public class CourseDetailDto : CourseDto
    {
        public List<ModuleDto> Modules { get; set; } = new List<ModuleDto>();
    }
}
