using DotLearn.Server.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Data.Repositories
{
    public class QuizRepository : Repository<QuizQuestion>, IQuizRepository
    {
        public QuizRepository(LmsDbContext context) : base(context) { }

        public async Task<IEnumerable<QuizQuestion>> GetQuestionsByLessonIdAsync(int lessonId)
        {
            return await _context.QuizQuestions
                .Where(q => q.LessonId == lessonId)
                .Include(q => q.Options)
                .OrderBy(q => q.OrderIndex)
                .ToListAsync();
        }

        public async Task<QuizQuestion?> GetQuestionWithOptionsAsync(int questionId)
        {
            return await _context.QuizQuestions
                .Include(q => q.Options)
                .Include(q => q.Lesson)
                    .ThenInclude(l => l.Module)
                        .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(q => q.Id == questionId);
        }

        public async Task<QuizOption?> GetOptionWithDetailsAsync(int optionId)
        {
            return await _context.QuizOptions
                .Include(o => o.Question)
                    .ThenInclude(q => q.Lesson)
                        .ThenInclude(l => l.Module)
                            .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(o => o.Id == optionId);
        }

        public async Task<QuizAttempt> CreateQuizAttemptAsync(QuizAttempt attempt)
        {
            _context.QuizAttempts.Add(attempt);
            await _context.SaveChangesAsync();
            return attempt;
        }

        public async Task<IEnumerable<QuizAttempt>> GetQuizAttemptsByLessonIdAsync(int lessonId)
        {
            return await _context.QuizAttempts
                .Where(a => a.LessonId == lessonId)
                .Include(a => a.User)
                .OrderByDescending(a => a.CompletedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<QuizAttempt>> GetQuizAttemptsByUserIdAsync(int userId, int lessonId)
        {
            return await _context.QuizAttempts
                .Where(a => a.UserId == userId && a.LessonId == lessonId)
                .Include(a => a.User)
                .OrderByDescending(a => a.CompletedAt)
                .ToListAsync();
        }

        public async Task<QuizOption> AddOptionToQuestionAsync(QuizOption option)
        {
            _context.QuizOptions.Add(option);
            await _context.SaveChangesAsync();
            return option;
        }

        public async Task<bool> UpdateOptionAsync(QuizOption option)
        {
            if (option == null)
                return false;

            _context.QuizOptions.Update(option);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteOptionAsync(int optionId)
        {
            var option = await _context.QuizOptions.FindAsync(optionId);
            if (option == null)
                return false;

            _context.QuizOptions.Remove(option);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleOptionCorrectStatusAsync(int optionId)
        {
            var option = await _context.QuizOptions
                .Include(o => o.Question)
                .FirstOrDefaultAsync(o => o.Id == optionId);

            if (option == null)
                return false;

            option.IsCorrect = !option.IsCorrect;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsUserAttemptAsync(int attemptId, int userId)
        {
            return await _context.QuizAttempts
                .AnyAsync(a => a.Id == attemptId && a.UserId == userId);
        }

        public async Task<bool> ResetAllOptionCorrectStatusAsync(int questionId)
        {
            var options = await _context.QuizOptions
                .Where(o => o.QuestionId == questionId)
                .ToListAsync();

            if (!options.Any())
                return false;

            foreach (var option in options)
            {
                option.IsCorrect = false;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> CountOptionsForQuestionAsync(int questionId)
        {
            return await _context.QuizOptions
                .CountAsync(o => o.QuestionId == questionId);
        }

        public async Task<bool> IsLastCorrectOptionAsync(int optionId)
        {
            var option = await _context.QuizOptions.FindAsync(optionId);
            if (option == null || !option.IsCorrect)
                return false;

            // If this is correct, check if it's the only correct one
            int correctOptionsCount = await _context.QuizOptions
                .CountAsync(o => o.QuestionId == option.QuestionId && o.IsCorrect);

            return correctOptionsCount <= 1;
        }

        public async Task<List<QuizOption>> GetOptionsByQuestionIdAsync(int questionId)
        {
            return await _context.QuizOptions
                .Where(o => o.QuestionId == questionId)
                .ToListAsync();
        }
    }
}