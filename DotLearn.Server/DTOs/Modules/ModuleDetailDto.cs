namespace DotLearn.Server.DTOs.Modules
{
    public class ModuleDetailDto : ModuleDto
    {
        public List<LessonDto> Lessons { get; set; } = new List<LessonDto>();
    }
}
