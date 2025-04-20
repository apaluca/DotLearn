namespace DotLearn.Server.DTOs.Quizzes
{
    public class QuizOptionDto
    {
        public int Id { get; set; }
        public string OptionText { get; set; }
        public bool? IsCorrect { get; set; } // Nullable - only shown to instructors
    }
}
