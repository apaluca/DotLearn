using DotLearn.Server.DTOs.Quizzes;

namespace DotLearn.Server.Services
{
    public interface IQuizService
    {
        Task<QuizDto> GetQuizByLessonAsync(int lessonId, int userId, string userRole);
        Task<QuizResultDto> SubmitQuizAsync(SubmitQuizDto submitQuizDto, int userId, string userRole);
        Task<QuizQuestionDto> AddQuizQuestionAsync(int lessonId, QuizQuestionDto questionDto, int userId, string userRole);
        Task<QuizOptionDto> AddOptionToQuestionAsync(int questionId, QuizOptionDto optionDto, int userId, string userRole);
        Task UpdateOptionAsync(int id, QuizOptionDto optionDto, int userId, string userRole);
        Task DeleteOptionAsync(int id, int userId, string userRole);
        Task SetCorrectOptionAsync(int id, int userId, string userRole);
        Task ToggleCorrectOptionAsync(int id, int userId, string userRole);
        Task DeleteQuestionAsync(int id, int userId, string userRole);
        Task UpdateQuestionAsync(int id, QuizQuestionDto questionDto, int userId, string userRole);
        Task<IEnumerable<QuizAttemptDto>> GetQuizAttemptsAsync(int lessonId, int userId, string userRole);
    }
}