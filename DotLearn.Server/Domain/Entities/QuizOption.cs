﻿namespace DotLearn.Server.Domain.Entities
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
