namespace DotLearn.Server.DTOs.Quizzes
{
    public class SubmitQuizAnswerDto
    {
        public int QuestionId { get; set; }
        public List<int> SelectedOptionIds { get; set; } = new List<int>();
    }
}
