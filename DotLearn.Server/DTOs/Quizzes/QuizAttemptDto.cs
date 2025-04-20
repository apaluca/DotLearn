namespace DotLearn.Server.DTOs.Quizzes
{
    public class QuizAttemptDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public int LessonId { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public bool Passed { get; set; }
        public double ScorePercentage { get; set; }
    }
}
