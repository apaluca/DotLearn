using Microsoft.VisualBasic.FileIO;

namespace DotLearn.Server.Models
{
    namespace DotLearn.Server.Models
    {
        public class QuizQuestion
        {
            public int Id { get; set; }
            public int LessonId { get; set; }
            public Lesson Lesson { get; set; }
            public string QuestionText { get; set; }
            public int OrderIndex { get; set; }
            public ICollection<QuizOption> Options { get; set; }
        }
    }
}
