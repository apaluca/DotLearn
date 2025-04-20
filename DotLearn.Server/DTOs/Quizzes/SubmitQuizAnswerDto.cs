namespace DotLearn.Server.DTOs.Quizzes
{
    public class SubmitQuizAnswerDto
    {
        public int QuestionId { get; set; }
        public int? SelectedOptionId { get; set; }
    }
}
