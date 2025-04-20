namespace DotLearn.Server.DTOs.Quizzes
{
    public class SubmitQuizDto
    {
        public int LessonId { get; set; }
        public List<SubmitQuizAnswerDto> Answers { get; set; } = new List<SubmitQuizAnswerDto>();
    }
}
