namespace DotLearn.Server.DTOs.Quizzes
{
    public class QuizAnswerResultDto
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; }
        public string QuestionType { get; set; } = "SingleChoice"; // Default
        public bool IsCorrect { get; set; }

        // For display purposes
        public List<int> SelectedOptionIds { get; set; } = new List<int>();
        public List<string> SelectedOptionTexts { get; set; } = new List<string>();
        public List<int> CorrectOptionIds { get; set; } = new List<int>();
        public List<string> CorrectOptionTexts { get; set; } = new List<string>();
    }
}
