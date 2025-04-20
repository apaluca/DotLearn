namespace DotLearn.Server.DTOs.Quizzes
{
    public class QuizResultDto
    {
        public int AttemptId { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public bool Passed { get; set; }
        public DateTime CompletedAt { get; set; }
        public List<QuizAnswerResultDto> Answers { get; set; } = new List<QuizAnswerResultDto>();
    }
}
