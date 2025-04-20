namespace DotLearn.Server.DTOs.Quizzes
{
    public class QuizDto
    {
        public int LessonId { get; set; }
        public string LessonTitle { get; set; }
        public List<QuizQuestionDto> Questions { get; set; } = new List<QuizQuestionDto>();
    }
}
