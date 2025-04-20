using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Quizzes;
using DotLearn.Server.Models.DotLearn.Server.Models;
using DotLearn.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuizzesController : ControllerBase
    {
        private readonly LmsDbContext _context;

        public QuizzesController(LmsDbContext context)
        {
            _context = context;
        }

        // GET: api/quizzes/lesson/5
        [HttpGet("lesson/{lessonId}")]
        public async Task<ActionResult<QuizDto>> GetQuizByLesson(int lessonId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
            }

            // Check if this is actually a quiz
            if (lesson.Type != LessonType.Quiz)
            {
                return BadRequest("This lesson is not a quiz");
            }

            // Verify user has access to this lesson
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }

            var questions = await _context.QuizQuestions
                .Where(q => q.LessonId == lessonId)
                .OrderBy(q => q.OrderIndex)
                .Select(q => new QuizQuestionDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    OrderIndex = q.OrderIndex,
                    Options = q.Options.Select(o => new QuizOptionDto
                    {
                        Id = o.Id,
                        OptionText = o.OptionText
                    }).ToList()
                })
                .ToListAsync();

            var quiz = new QuizDto
            {
                LessonId = lessonId,
                LessonTitle = lesson.Title,
                Questions = questions
            };

            return quiz;
        }

        // POST: api/quizzes/submit
        [HttpPost("submit")]
        public async Task<ActionResult<QuizResultDto>> SubmitQuiz(SubmitQuizDto submitQuizDto)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == submitQuizDto.LessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
            }

            // Check if this is actually a quiz
            if (lesson.Type != LessonType.Quiz)
            {
                return BadRequest("This lesson is not a quiz");
            }

            // Verify user has access to this lesson
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }

            // Get all questions and correct answers
            var questions = await _context.QuizQuestions
                .Where(q => q.LessonId == submitQuizDto.LessonId)
                .Include(q => q.Options)
                .ToListAsync();

            // Calculate score
            int totalQuestions = questions.Count;
            int score = 0;
            var answerResults = new List<QuizAnswerResultDto>();

            foreach (var question in questions)
            {
                var answer = submitQuizDto.Answers.FirstOrDefault(a => a.QuestionId == question.Id);
                var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);
                bool isCorrect = false;

                if (answer != null && correctOption != null && answer.SelectedOptionId == correctOption.Id)
                {
                    isCorrect = true;
                    score++;
                }

                var selectedOption = answer?.SelectedOptionId != null
                    ? question.Options.FirstOrDefault(o => o.Id == answer.SelectedOptionId)
                    : null;

                answerResults.Add(new QuizAnswerResultDto
                {
                    QuestionId = question.Id,
                    QuestionText = question.QuestionText,
                    SelectedOptionId = answer?.SelectedOptionId,
                    SelectedOptionText = selectedOption?.OptionText,
                    IsCorrect = isCorrect,
                    CorrectOptionId = correctOption?.Id ?? 0,
                    CorrectOptionText = correctOption?.OptionText
                });
            }

            // Determine if passed (70% or better)
            bool passed = (double)score / totalQuestions >= 0.7;

            // Create quiz attempt record
            var attempt = new QuizAttempt
            {
                LessonId = submitQuizDto.LessonId,
                UserId = userId,
                StartedAt = DateTime.Now.AddMinutes(-5), // Assuming started 5 minutes ago
                CompletedAt = DateTime.Now,
                Score = score,
                TotalQuestions = totalQuestions,
                Passed = passed,
                Answers = submitQuizDto.Answers.Select(a => new QuizAnswer
                {
                    QuestionId = a.QuestionId,
                    SelectedOptionId = a.SelectedOptionId,
                    IsCorrect = questions
                        .FirstOrDefault(q => q.Id == a.QuestionId)?.Options
                        .FirstOrDefault(o => o.Id == a.SelectedOptionId)?.IsCorrect ?? false
                }).ToList()
            };

            _context.QuizAttempts.Add(attempt);
            await _context.SaveChangesAsync();

            // Update user progress
            if (passed)
            {
                // Mark lesson as completed in user progress
                // This would connect to your lesson progress tracking system
            }

            return new QuizResultDto
            {
                AttemptId = attempt.Id,
                Score = score,
                TotalQuestions = totalQuestions,
                Passed = passed,
                CompletedAt = attempt.CompletedAt.Value,
                Answers = answerResults
            };
        }

        // POST: api/quizzes/lesson/5/questions
        [HttpPost("lesson/{lessonId}/questions")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<QuizQuestionDto>> AddQuizQuestion(int lessonId, [FromBody] QuizQuestionDto questionDto)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
            }

            // Check if this is actually a quiz
            if (lesson.Type != LessonType.Quiz)
            {
                return BadRequest("This lesson is not a quiz");
            }

            // Verify user has permission
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                return Forbid();
            }

            // Determine next order index
            int nextOrderIndex = 1;
            var lastQuestion = await _context.QuizQuestions
                .Where(q => q.LessonId == lessonId)
                .OrderByDescending(q => q.OrderIndex)
                .FirstOrDefaultAsync();

            if (lastQuestion != null)
            {
                nextOrderIndex = lastQuestion.OrderIndex + 1;
            }

            var question = new QuizQuestion
            {
                LessonId = lessonId,
                QuestionText = questionDto.QuestionText,
                OrderIndex = nextOrderIndex,
                Options = questionDto.Options.Select(o => new QuizOption
                {
                    OptionText = o.OptionText,
                    IsCorrect = false // Default to false, will be updated separately
                }).ToList()
            };

            _context.QuizQuestions.Add(question);
            await _context.SaveChangesAsync();

            // Return the created question with IDs
            return new QuizQuestionDto
            {
                Id = question.Id,
                QuestionText = question.QuestionText,
                OrderIndex = question.OrderIndex,
                Options = question.Options.Select(o => new QuizOptionDto
                {
                    Id = o.Id,
                    OptionText = o.OptionText
                }).ToList()
            };
        }

        // PUT: api/quizzes/options/5/correct
        [HttpPut("options/{id}/correct")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> SetCorrectOption(int id)
        {
            var option = await _context.QuizOptions
                .Include(o => o.Question)
                    .ThenInclude(q => q.Lesson)
                        .ThenInclude(l => l.Module)
                            .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (option == null)
            {
                return NotFound();
            }

            // Verify user has permission
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = option.Question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                return Forbid();
            }

            // Reset all options for this question to false
            var questionOptions = await _context.QuizOptions
                .Where(o => o.QuestionId == option.QuestionId)
                .ToListAsync();

            foreach (var o in questionOptions)
            {
                o.IsCorrect = false;
            }

            // Set this option as correct
            option.IsCorrect = true;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
