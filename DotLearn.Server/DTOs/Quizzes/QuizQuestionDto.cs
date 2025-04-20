namespace DotLearn.Server.DTOs.Quizzes
{
    public class QuizQuestionDto
    {
        public int Id { get; set; }
        public string QuestionText { get; set; }
        public int OrderIndex { get; set; }
        public List<QuizOptionDto> Options { get; set; } = new List<QuizOptionDto>();
    }
}
