using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;

public interface IQuizRepository : IRepository<QuizQuestion>
{
    Task<IEnumerable<QuizQuestion>> GetQuestionsByLessonIdAsync(int lessonId);
    Task<QuizQuestion?> GetQuestionWithOptionsAsync(int questionId);
    Task<QuizAttempt> CreateQuizAttemptAsync(QuizAttempt attempt);
    Task<IEnumerable<QuizAttempt>> GetQuizAttemptsByLessonIdAsync(int lessonId);
    Task<IEnumerable<QuizAttempt>> GetQuizAttemptsByUserIdAsync(int userId, int lessonId);
    Task<QuizOption> AddOptionToQuestionAsync(QuizOption option);
    Task<bool> DeleteOptionAsync(int optionId);
    Task<bool> ToggleOptionCorrectStatusAsync(int optionId);
    Task<bool> IsUserAttemptAsync(int attemptId, int userId);
    Task<bool> ResetAllOptionCorrectStatusAsync(int questionId);
    Task<QuizOption?> GetOptionWithDetailsAsync(int optionId);
    Task<bool> UpdateOptionAsync(QuizOption option);
    Task<int> CountOptionsForQuestionAsync(int questionId);
    Task<bool> IsLastCorrectOptionAsync(int optionId);
    Task<List<QuizOption>> GetOptionsByQuestionIdAsync(int questionId);
}