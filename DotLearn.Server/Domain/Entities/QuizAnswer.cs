namespace DotLearn.Server.Domain.Entities
{
    public class QuizAnswer
    {
        public int Id { get; set; }
        public int AttemptId { get; set; }
        public QuizAttempt Attempt { get; set; }
        public int QuestionId { get; set; }
        public QuizQuestion Question { get; set; }
        public int? SelectedOptionId { get; set; }
        public QuizOption SelectedOption { get; set; }
        public bool IsCorrect { get; set; }
    }
}
