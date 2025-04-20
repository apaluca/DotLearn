using DotLearn.Server.Models.DotLearn.Server.Models;

namespace DotLearn.Server.Models
{
    public class QuizOption
    {
        public int Id { get; set; }
        public int QuestionId { get; set; }
        public QuizQuestion Question { get; set; }
        public string OptionText { get; set; }
        public bool IsCorrect { get; set; }
    }
}
