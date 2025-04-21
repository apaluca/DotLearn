using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Quizzes;
using DotLearn.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
                    QuestionType = q.QuestionType.ToString(),
                    Options = q.Options.Select(o => new QuizOptionDto
                    {
                        Id = o.Id,
                        OptionText = o.OptionText,
                        IsCorrect = isInstructor || isAdmin ? o.IsCorrect : null // Only show correct answers to instructors/admins
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

            // Create quiz attempt record
            var attempt = new QuizAttempt
            {
                LessonId = submitQuizDto.LessonId,
                UserId = userId,
                StartedAt = DateTime.Now.AddMinutes(-5), // Assuming started 5 minutes ago
                CompletedAt = DateTime.Now,
                TotalQuestions = totalQuestions,
                Answers = new List<QuizAnswer>()
            };

            foreach (var question in questions)
            {
                var answer = submitQuizDto.Answers.FirstOrDefault(a => a.QuestionId == question.Id);
                var correctOptions = question.Options.Where(o => o.IsCorrect).ToList();
                bool isCorrect = false;

                // Create the answer result DTO
                var resultDto = new QuizAnswerResultDto
                {
                    QuestionId = question.Id,
                    QuestionText = question.QuestionText,
                    QuestionType = question.QuestionType.ToString(),
                    SelectedOptionIds = answer?.SelectedOptionIds ?? new List<int>(),
                    CorrectOptionIds = correctOptions.Select(o => o.Id).ToList(),
                    CorrectOptionTexts = correctOptions.Select(o => o.OptionText).ToList()
                };

                if (answer != null && answer.SelectedOptionIds.Count > 0)
                {
                    // Get the selected options
                    var selectedOptions = question.Options
                        .Where(o => answer.SelectedOptionIds.Contains(o.Id))
                        .ToList();

                    resultDto.SelectedOptionTexts = selectedOptions.Select(o => o.OptionText).ToList();

                    if (question.QuestionType == QuestionType.SingleChoice)
                    {
                        // For single choice, the answer is correct if the selected option is correct
                        isCorrect = answer.SelectedOptionIds.Count == 1 &&
                                   correctOptions.Any(o => o.Id == answer.SelectedOptionIds[0]);
                    }
                    else // MultipleChoice
                    {
                        // For multiple choice, all correct options must be selected and no incorrect ones
                        isCorrect = correctOptions.Count > 0 &&
                                   correctOptions.All(o => answer.SelectedOptionIds.Contains(o.Id)) &&
                                   answer.SelectedOptionIds.All(id => correctOptions.Any(o => o.Id == id));
                    }

                    if (isCorrect)
                    {
                        score++;
                    }

                    // Add each selected option as a separate answer
                    foreach (var optionId in answer.SelectedOptionIds)
                    {
                        attempt.Answers.Add(new QuizAnswer
                        {
                            QuestionId = question.Id,
                            SelectedOptionId = optionId,
                            IsCorrect = isCorrect
                        });
                    }
                }
                else
                {
                    // No answer provided
                    resultDto.SelectedOptionTexts = new List<string>();

                    // Add a null answer to track that the question was seen but not answered
                    attempt.Answers.Add(new QuizAnswer
                    {
                        QuestionId = question.Id,
                        SelectedOptionId = null,
                        IsCorrect = false
                    });
                }

                resultDto.IsCorrect = isCorrect;
                answerResults.Add(resultDto);
            }

            // Determine if passed (70% or better)
            bool passed = (double)score / totalQuestions >= 0.7;
            attempt.Score = score;
            attempt.Passed = passed;

            _context.QuizAttempts.Add(attempt);
            await _context.SaveChangesAsync();

            // Update user progress if passed
            if (passed)
            {
                // Check if progress record exists
                var progress = await _context.LessonProgress
                    .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.LessonId == lesson.Id);

                if (progress == null)
                {
                    // Create new progress record and mark as completed
                    progress = new LessonProgress
                    {
                        UserId = userId,
                        LessonId = lesson.Id,
                        StartedAt = DateTime.Now.AddMinutes(-5),
                        CompletedAt = DateTime.Now,
                        IsCompleted = true
                    };

                    _context.LessonProgress.Add(progress);
                }
                else if (!progress.IsCompleted)
                {
                    // Update existing progress to completed
                    progress.CompletedAt = DateTime.Now;
                    progress.IsCompleted = true;
                }

                await _context.SaveChangesAsync();
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

            // Parse question type, default to SingleChoice if invalid
            QuestionType questionType = QuestionType.SingleChoice;
            if (!string.IsNullOrEmpty(questionDto.QuestionType) &&
                Enum.TryParse<QuestionType>(questionDto.QuestionType, out var parsedType))
            {
                questionType = parsedType;
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
                QuestionType = questionType,
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
                QuestionType = question.QuestionType.ToString(),
                Options = question.Options.Select(o => new QuizOptionDto
                {
                    Id = o.Id,
                    OptionText = o.OptionText,
                    IsCorrect = false
                }).ToList()
            };
        }

        // POST: api/quizzes/questions/{questionId}/options
        [HttpPost("questions/{questionId}/options")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<QuizOptionDto>> AddOptionToQuestion(int questionId, [FromBody] QuizOptionDto optionDto)
        {
            var question = await _context.QuizQuestions
                .Include(q => q.Lesson)
                    .ThenInclude(l => l.Module)
                        .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null)
            {
                return NotFound("Question not found");
            }

            // Verify user has permission
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                return Forbid();
            }

            // Create the new option
            var option = new QuizOption
            {
                QuestionId = questionId,
                OptionText = optionDto.OptionText,
                IsCorrect = false // Default to false, will be set separately if needed
            };

            _context.QuizOptions.Add(option);
            await _context.SaveChangesAsync();

            return new QuizOptionDto
            {
                Id = option.Id,
                OptionText = option.OptionText,
                IsCorrect = false
            };
        }

        // PUT: api/quizzes/options/{id}
        [HttpPut("options/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateOption(int id, [FromBody] QuizOptionDto optionDto)
        {
            var option = await _context.QuizOptions
                .Include(o => o.Question)
                    .ThenInclude(q => q.Lesson)
                        .ThenInclude(l => l.Module)
                            .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (option == null)
            {
                return NotFound("Option not found");
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

            // Update option text
            option.OptionText = optionDto.OptionText;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/quizzes/options/{id}
        [HttpDelete("options/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteOption(int id)
        {
            var option = await _context.QuizOptions
                .Include(o => o.Question)
                    .ThenInclude(q => q.Lesson)
                        .ThenInclude(l => l.Module)
                            .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (option == null)
            {
                return NotFound("Option not found");
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

            // Check if this is the last correct option for the question
            bool isLastCorrectOption = option.IsCorrect &&
                                      await _context.QuizOptions
                                      .CountAsync(o => o.QuestionId == option.QuestionId && o.IsCorrect) == 1;

            // Ensure there will be at least 2 options left after deletion
            int optionCount = await _context.QuizOptions.CountAsync(o => o.QuestionId == option.QuestionId);
            if (optionCount <= 2)
            {
                return BadRequest("Cannot delete option: Questions must have at least 2 options");
            }

            // If this is the last correct option, don't allow deletion
            if (isLastCorrectOption)
            {
                return BadRequest("Cannot delete the only correct option. Mark another option as correct first.");
            }

            _context.QuizOptions.Remove(option);
            await _context.SaveChangesAsync();

            return NoContent();
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

            // For single choice questions, reset all options and set only this one as correct
            if (option.Question.QuestionType == QuestionType.SingleChoice)
            {
                // Reset all options for this question to false
                var questionOptions = await _context.QuizOptions
                    .Where(o => o.QuestionId == option.QuestionId)
                    .ToListAsync();

                foreach (var o in questionOptions)
                {
                    o.IsCorrect = false;
                }
            }

            // Set this option as correct
            option.IsCorrect = true;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/quizzes/options/5/toggle-correct
        [HttpPut("options/{id}/toggle-correct")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> ToggleCorrectOption(int id)
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

            // Only allow toggling if question is multiple choice
            if (option.Question.QuestionType != QuestionType.MultipleChoice)
            {
                return BadRequest("Cannot toggle correctness for single-choice questions");
            }

            // Toggle this option's correctness
            option.IsCorrect = !option.IsCorrect;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/quizzes/questions/5
        [HttpDelete("questions/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _context.QuizQuestions
                .Include(q => q.Lesson)
                    .ThenInclude(l => l.Module)
                        .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (question == null)
            {
                return NotFound();
            }

            // Verify user has permission
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                return Forbid();
            }

            // Delete the question and its options (cascade delete will handle options)
            _context.QuizQuestions.Remove(question);

            // Update order indexes of subsequent questions
            var laterQuestions = await _context.QuizQuestions
                .Where(q => q.LessonId == question.LessonId && q.OrderIndex > question.OrderIndex)
                .ToListAsync();

            foreach (var q in laterQuestions)
            {
                q.OrderIndex--;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/quizzes/questions/5
        [HttpPut("questions/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromBody] QuizQuestionDto questionDto)
        {
            var question = await _context.QuizQuestions
                .Include(q => q.Lesson)
                    .ThenInclude(l => l.Module)
                        .ThenInclude(m => m.Course)
                .Include(q => q.Options)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (question == null)
            {
                return NotFound();
            }

            // Verify user has permission
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                return Forbid();
            }

            // Update question text
            question.QuestionText = questionDto.QuestionText;

            // Parse and update question type if valid
            if (!string.IsNullOrEmpty(questionDto.QuestionType) &&
                Enum.TryParse<QuestionType>(questionDto.QuestionType, out var parsedType))
            {
                // Check if type is changing
                bool typeChanged = question.QuestionType != parsedType;

                question.QuestionType = parsedType;

                // If changing from multiple choice to single choice, ensure only one option is correct
                if (typeChanged && parsedType == QuestionType.SingleChoice)
                {
                    // Reset all to false first
                    foreach (var option in question.Options)
                    {
                        option.IsCorrect = false;
                    }

                    // Then set the first correct option (if any) to true
                    var firstCorrectOption = questionDto.Options
                        .FirstOrDefault(o => o.IsCorrect == true);

                    if (firstCorrectOption != null && firstCorrectOption.Id > 0)
                    {
                        var optionToMakeCorrect = question.Options
                            .FirstOrDefault(o => o.Id == firstCorrectOption.Id);

                        if (optionToMakeCorrect != null)
                        {
                            optionToMakeCorrect.IsCorrect = true;
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/quizzes/attempts/lesson/5
        [HttpGet("attempts/lesson/{lessonId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<QuizAttemptDto>>> GetQuizAttempts(int lessonId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
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

            // For students, return only their own attempts
            // For instructors/admins, return all attempts for this lesson
            IQueryable<QuizAttempt> attemptsQuery = _context.QuizAttempts
                .Where(a => a.LessonId == lessonId);

            if (!isInstructor && !isAdmin)
            {
                attemptsQuery = attemptsQuery.Where(a => a.UserId == userId);
            }

            var attempts = await attemptsQuery
                .OrderByDescending(a => a.CompletedAt)
                .Include(a => a.User)
                .Select(a => new QuizAttemptDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    UserName = a.User.Username,
                    LessonId = a.LessonId,
                    StartedAt = a.StartedAt,
                    CompletedAt = a.CompletedAt,
                    Score = a.Score,
                    TotalQuestions = a.TotalQuestions,
                    Passed = a.Passed,
                    ScorePercentage = a.TotalQuestions > 0
                        ? (double)a.Score / a.TotalQuestions * 100
                        : 0
                })
                .ToListAsync();

            return attempts;
        }
    }
}