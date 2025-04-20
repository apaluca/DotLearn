namespace DotLearn.Server.Models
{
    public class QuizAttempt
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public bool Passed { get; set; }
        public ICollection<QuizAnswer> Answers { get; set; }
    }
}
