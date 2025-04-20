namespace DotLearn.Server.DTOs.Quizzes
{
    public class QuizAnswerResultDto
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; }
        public int? SelectedOptionId { get; set; }
        public string SelectedOptionText { get; set; }
        public bool IsCorrect { get; set; }
        public int CorrectOptionId { get; set; }
        public string CorrectOptionText { get; set; }
    }
}
