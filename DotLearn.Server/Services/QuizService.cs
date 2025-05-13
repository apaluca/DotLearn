using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.DTOs.Quizzes;
using DotLearn.Server.Models;

namespace DotLearn.Server.Services
{
    public class QuizService : IQuizService
    {
        private readonly IQuizRepository _quizRepository;
        private readonly ILessonRepository _lessonRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly IProgressRepository _progressRepository;

        public QuizService(
            IQuizRepository quizRepository,
            ILessonRepository lessonRepository,
            IEnrollmentRepository enrollmentRepository,
            IProgressRepository progressRepository)
        {
            _quizRepository = quizRepository;
            _lessonRepository = lessonRepository;
            _enrollmentRepository = enrollmentRepository;
            _progressRepository = progressRepository;
        }

        public async Task<QuizDto> GetQuizByLessonAsync(int lessonId, int userId, string? userRole)
        {
            userRole ??= "Student";

            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(lessonId);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {lessonId} not found");
            }

            // Check if this is actually a quiz
            if (lesson.Type != LessonType.Quiz)
            {
                throw new BadRequestException("This lesson is not a quiz");
            }

            // Verify user has access to this lesson
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(
                userId, lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to view this quiz");
            }

            var questions = await _quizRepository.GetQuestionsByLessonIdAsync(lessonId);

            var quiz = new QuizDto
            {
                LessonId = lessonId,
                LessonTitle = lesson.Title,
                Questions = questions.Select(q => new QuizQuestionDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    OrderIndex = q.OrderIndex,
                    QuestionType = q.QuestionType.ToString(),
                    Options = q.Options.Select(o => new QuizOptionDto
                    {
                        Id = o.Id,
                        OptionText = o.OptionText,
                        // Only show correct answers to instructors/admins
                        IsCorrect = isInstructor || isAdmin ? (bool?)o.IsCorrect : null
                    }).ToList()
                }).ToList()
            };

            return quiz;
        }

        public async Task<QuizResultDto> SubmitQuizAsync(SubmitQuizDto submitQuizDto, int userId, string? userRole)
        {
            userRole ??= "Student";

            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(submitQuizDto.LessonId);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {submitQuizDto.LessonId} not found");
            }

            // Check if this is actually a quiz
            if (lesson.Type != LessonType.Quiz)
            {
                throw new BadRequestException("This lesson is not a quiz");
            }

            // Verify user has access to this lesson
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(
                userId, lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to submit this quiz");
            }

            // Get all questions and options
            var questions = await _quizRepository.GetQuestionsByLessonIdAsync(submitQuizDto.LessonId);

            // Calculate score
            int totalQuestions = questions.Count();
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
            bool passed = totalQuestions > 0 && (double)score / totalQuestions >= 0.7;
            attempt.Score = score;
            attempt.Passed = passed;

            // Save the attempt
            await _quizRepository.CreateQuizAttemptAsync(attempt);

            // Update user progress if passed
            if (passed)
            {
                // Check if progress record exists
                var progress = await _progressRepository.GetProgressByUserAndLessonAsync(userId, lesson.Id);

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

                    await _progressRepository.AddAsync(progress);
                }
                else if (!progress.IsCompleted)
                {
                    // Update existing progress to completed
                    progress.CompletedAt = DateTime.Now;
                    progress.IsCompleted = true;
                    await _progressRepository.UpdateAsync(progress);
                }

                await _progressRepository.SaveChangesAsync();
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

        public async Task<QuizQuestionDto> AddQuizQuestionAsync(int lessonId, QuizQuestionDto questionDto, int userId, string? userRole)
        {
            userRole ??= "Student";

            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(lessonId);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {lessonId} not found");
            }

            // Check if this is actually a quiz
            if (lesson.Type != LessonType.Quiz)
            {
                throw new BadRequestException("This lesson is not a quiz");
            }

            // Verify user has permission
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to add questions to this quiz");
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
            var questions = await _quizRepository.GetQuestionsByLessonIdAsync(lessonId);
            if (questions.Any())
            {
                nextOrderIndex = questions.Max(q => q.OrderIndex) + 1;
            }

            var question = new QuizQuestion
            {
                LessonId = lessonId,
                QuestionText = questionDto.QuestionText ?? "New Question",
                OrderIndex = nextOrderIndex,
                QuestionType = questionType,
                Options = new List<QuizOption>()
            };

            // Add options if provided
            if (questionDto.Options != null && questionDto.Options.Any())
            {
                foreach (var optionDto in questionDto.Options)
                {
                    question.Options.Add(new QuizOption
                    {
                        OptionText = optionDto.OptionText ?? "New Option",
                        IsCorrect = optionDto.IsCorrect ?? false
                    });
                }
            }

            await _quizRepository.AddAsync(question);
            await _quizRepository.SaveChangesAsync();

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
                    IsCorrect = o.IsCorrect
                }).ToList()
            };
        }

        public async Task<QuizOptionDto> AddOptionToQuestionAsync(int questionId, QuizOptionDto optionDto, int userId, string? userRole)
        {
            userRole ??= "Student";

            var question = await _quizRepository.GetQuestionWithOptionsAsync(questionId);
            if (question == null)
            {
                throw new NotFoundException($"Question with ID {questionId} not found");
            }

            // Verify user has permission
            bool isInstructor = question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to add options to this question");
            }

            // Create the new option
            var option = new QuizOption
            {
                QuestionId = questionId,
                OptionText = optionDto.OptionText ?? "New Option",
                IsCorrect = optionDto.IsCorrect ?? false
            };

            await _quizRepository.AddOptionToQuestionAsync(option);

            return new QuizOptionDto
            {
                Id = option.Id,
                OptionText = option.OptionText,
                IsCorrect = option.IsCorrect
            };
        }

        public async Task UpdateOptionAsync(int id, QuizOptionDto optionDto, int userId, string? userRole)
        {
            userRole ??= "Student";

            var option = await _quizRepository.GetOptionWithDetailsAsync(id);
            if (option == null)
            {
                throw new NotFoundException($"Option with ID {id} not found");
            }

            // Verify user has permission
            bool isInstructor = option.Question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to update this option");
            }

            // Update option text
            option.OptionText = optionDto.OptionText ?? option.OptionText;

            // Only update IsCorrect if explicitly provided
            if (optionDto.IsCorrect.HasValue)
            {
                option.IsCorrect = optionDto.IsCorrect.Value;
            }

            await _quizRepository.UpdateOptionAsync(option);
        }

        public async Task DeleteOptionAsync(int id, int userId, string? userRole)
        {
            userRole ??= "Student";

            var option = await _quizRepository.GetOptionWithDetailsAsync(id);
            if (option == null)
            {
                throw new NotFoundException($"Option with ID {id} not found");
            }

            // Verify user has permission
            bool isInstructor = option.Question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to delete this option");
            }

            // Check if this is the last correct option for the question
            bool isLastCorrectOption = await _quizRepository.IsLastCorrectOptionAsync(id);

            // Ensure there will be at least 2 options left after deletion
            int optionCount = await _quizRepository.CountOptionsForQuestionAsync(option.QuestionId);
            if (optionCount <= 2)
            {
                throw new BadRequestException("Cannot delete option: Questions must have at least 2 options");
            }

            // If this is the last correct option, don't allow deletion
            if (isLastCorrectOption)
            {
                throw new BadRequestException("Cannot delete the only correct option. Mark another option as correct first.");
            }

            await _quizRepository.DeleteOptionAsync(id);
        }

        public async Task SetCorrectOptionAsync(int id, int userId, string? userRole)
        {
            userRole ??= "Student";

            var option = await _quizRepository.GetOptionWithDetailsAsync(id);
            if (option == null)
            {
                throw new NotFoundException($"Option with ID {id} not found");
            }

            // Verify user has permission
            bool isInstructor = option.Question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to update this option");
            }

            // For single choice questions, reset all options and set only this one as correct
            if (option.Question.QuestionType == QuestionType.SingleChoice)
            {
                // Reset all options for this question to false
                await _quizRepository.ResetAllOptionCorrectStatusAsync(option.QuestionId);

                // Re-fetch the option after resetting others
                option = await _quizRepository.GetOptionWithDetailsAsync(id) ??
                    throw new NotFoundException($"Option with ID {id} not found after resetting options");
            }

            // Set this option as correct
            option.IsCorrect = true;
            await _quizRepository.UpdateOptionAsync(option);
        }

        public async Task ToggleCorrectOptionAsync(int id, int userId, string? userRole)
        {
            userRole ??= "Student";

            var option = await _quizRepository.GetOptionWithDetailsAsync(id);
            if (option == null)
            {
                throw new NotFoundException($"Option with ID {id} not found");
            }

            // Verify user has permission
            bool isInstructor = option.Question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to update this option");
            }

            // Only allow toggling if question is multiple choice
            if (option.Question.QuestionType != QuestionType.MultipleChoice)
            {
                throw new BadRequestException("Cannot toggle correctness for single-choice questions");
            }

            // Toggle this option's correctness
            await _quizRepository.ToggleOptionCorrectStatusAsync(id);
        }

        public async Task DeleteQuestionAsync(int id, int userId, string? userRole)
        {
            userRole ??= "Student";

            var question = await _quizRepository.GetQuestionWithOptionsAsync(id);
            if (question == null)
            {
                throw new NotFoundException($"Question with ID {id} not found");
            }

            // Verify user has permission
            bool isInstructor = question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to delete this question");
            }

            // Delete the question and its options (cascade delete will handle options)
            await _quizRepository.DeleteAsync(question);

            // Update order indexes of subsequent questions
            var laterQuestions = await _quizRepository.GetQuestionsByLessonIdAsync(question.LessonId);
            var questionsToUpdate = laterQuestions.Where(q => q.OrderIndex > question.OrderIndex);

            foreach (var q in questionsToUpdate)
            {
                q.OrderIndex--;
                await _quizRepository.UpdateAsync(q);
            }
        }

        public async Task UpdateQuestionAsync(int id, QuizQuestionDto questionDto, int userId, string? userRole)
        {
            userRole ??= "Student";

            var question = await _quizRepository.GetQuestionWithOptionsAsync(id);
            if (question == null)
            {
                throw new NotFoundException($"Question with ID {id} not found");
            }

            // Verify user has permission
            bool isInstructor = question.Lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to update this question");
            }

            // Update question text
            question.QuestionText = questionDto.QuestionText ?? question.QuestionText;

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
                    await _quizRepository.ResetAllOptionCorrectStatusAsync(question.Id);

                    // Then set the first correct option (if any) to true
                    var firstCorrectOption = questionDto.Options
                        ?.FirstOrDefault(o => o.IsCorrect == true);

                    if (firstCorrectOption != null && firstCorrectOption.Id > 0)
                    {
                        var options = await _quizRepository.GetOptionsByQuestionIdAsync(question.Id);
                        var optionToMakeCorrect = options
                            .FirstOrDefault(o => o.Id == firstCorrectOption.Id);

                        if (optionToMakeCorrect != null)
                        {
                            optionToMakeCorrect.IsCorrect = true;
                            await _quizRepository.UpdateOptionAsync(optionToMakeCorrect);
                        }
                    }
                }
            }

            await _quizRepository.UpdateAsync(question);
        }

        public async Task<IEnumerable<QuizAttemptDto>> GetQuizAttemptsAsync(int lessonId, int userId, string? userRole)
        {
            userRole ??= "Student";

            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(lessonId);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {lessonId} not found");
            }

            // Verify user has access to this lesson
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(
                userId, lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to view quiz attempts for this lesson");
            }

            IEnumerable<QuizAttempt> attempts;

            // For students, return only their own attempts
            // For instructors/admins, return all attempts for this lesson
            if (isInstructor || isAdmin)
            {
                attempts = await _quizRepository.GetQuizAttemptsByLessonIdAsync(lessonId);
            }
            else
            {
                attempts = await _quizRepository.GetQuizAttemptsByUserIdAsync(userId, lessonId);
            }

            return attempts.Select(a => new QuizAttemptDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.Username ?? $"User {a.UserId}",
                LessonId = a.LessonId,
                StartedAt = a.StartedAt,
                CompletedAt = a.CompletedAt,
                Score = a.Score,
                TotalQuestions = a.TotalQuestions,
                Passed = a.Passed,
                ScorePercentage = a.TotalQuestions > 0
                    ? Math.Round((double)a.Score / a.TotalQuestions * 100, 1)
                    : 0
            }).ToList();
        }
    }
}