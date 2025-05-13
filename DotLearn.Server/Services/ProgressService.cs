using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;
using DotLearn.Server.DTOs.Progress;

namespace DotLearn.Server.Services
{
    public class ProgressService : IProgressService
    {
        private readonly IProgressRepository _progressRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly ILessonRepository _lessonRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly IRepository<Module> _moduleRepository;

        public ProgressService(
            IProgressRepository progressRepository,
            ICourseRepository courseRepository,
            ILessonRepository lessonRepository,
            IEnrollmentRepository enrollmentRepository,
            IRepository<Module> moduleRepository)
        {
            _progressRepository = progressRepository;
            _courseRepository = courseRepository;
            _lessonRepository = lessonRepository;
            _enrollmentRepository = enrollmentRepository;
            _moduleRepository = moduleRepository;
        }

        public async Task<CourseProgressDto> GetCourseProgressAsync(int courseId, int userId, string userRole)
        {
            // Check if course exists
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {courseId} not found");
            }

            // Check if user has access to this course
            bool isInstructor = course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(userId, courseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to view progress for this course");
            }

            // Get the course with modules and lessons
            var courseDetails = await _courseRepository.GetCourseWithDetailsAsync(courseId);
            if (courseDetails == null)
            {
                throw new NotFoundException($"Course details with ID {courseId} not found");
            }

            // Get user's progress for all lessons in this course
            var lessonProgress = await _progressRepository.GetProgressByUserAndCourseAsync(userId, courseId);

            // Create progress DTO
            var courseProgress = new CourseProgressDto
            {
                CourseId = course.Id,
                CourseTitle = course.Title,
                TotalLessons = courseDetails.Modules.Sum(m => m.Lessons.Count),
                CompletedLessons = lessonProgress.Count(lp => lp.IsCompleted),
                Modules = new List<ModuleProgressDto>()
            };

            // Add module progress
            foreach (var module in courseDetails.Modules.OrderBy(m => m.OrderIndex))
            {
                var moduleProgress = new ModuleProgressDto
                {
                    ModuleId = module.Id,
                    ModuleTitle = module.Title,
                    TotalLessons = module.Lessons.Count,
                    CompletedLessons = lessonProgress.Count(lp =>
                        lp.IsCompleted && module.Lessons.Any(l => l.Id == lp.LessonId)),
                    Lessons = new List<LessonProgressDto>()
                };

                // Add lesson progress
                foreach (var lesson in module.Lessons.OrderBy(l => l.OrderIndex))
                {
                    var lessonProgressRecord = lessonProgress
                        .FirstOrDefault(lp => lp.LessonId == lesson.Id);

                    moduleProgress.Lessons.Add(new LessonProgressDto
                    {
                        LessonId = lesson.Id,
                        LessonTitle = lesson.Title,
                        ModuleId = module.Id,
                        ModuleTitle = module.Title,
                        IsCompleted = lessonProgressRecord?.IsCompleted ?? false,
                        StartedAt = lessonProgressRecord?.StartedAt,
                        CompletedAt = lessonProgressRecord?.CompletedAt
                    });
                }

                // Calculate module progress percentage
                moduleProgress.ProgressPercentage = moduleProgress.TotalLessons > 0
                    ? Math.Round((double)moduleProgress.CompletedLessons / moduleProgress.TotalLessons * 100, 1)
                    : 0;

                courseProgress.Modules.Add(moduleProgress);
            }

            // Calculate course progress percentage
            courseProgress.ProgressPercentage = courseProgress.TotalLessons > 0
                ? Math.Round((double)courseProgress.CompletedLessons / courseProgress.TotalLessons * 100, 1)
                : 0;

            return courseProgress;
        }

        public async Task<IEnumerable<CourseProgressDto>> GetProgressOverviewAsync(int userId)
        {
            // Get all enrolled courses for the user
            var enrolledCourses = await _enrollmentRepository.GetEnrolledCoursesForUserAsync(userId);

            var progressOverview = new List<CourseProgressDto>();

            foreach (var course in enrolledCourses)
            {
                // Get total lessons in the course
                var courseDetails = await _courseRepository.GetCourseWithDetailsAsync(course.Id);
                int totalLessons = courseDetails?.Modules.Sum(m => m.Lessons.Count) ?? 0;

                // Get completed lessons for this course
                int completedLessons = await _progressRepository.GetCompletedLessonsCountAsync(userId, course.Id);

                // Calculate progress percentage
                double progressPercentage = totalLessons > 0
                    ? Math.Round((double)completedLessons / totalLessons * 100, 1)
                    : 0;

                progressOverview.Add(new CourseProgressDto
                {
                    CourseId = course.Id,
                    CourseTitle = course.Title,
                    TotalLessons = totalLessons,
                    CompletedLessons = completedLessons,
                    ProgressPercentage = progressPercentage
                });
            }

            return progressOverview;
        }

        public async Task StartLessonAsync(MarkLessonCompleteDto dto, int userId, string userRole)
        {
            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(dto.LessonId);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {dto.LessonId} not found");
            }

            // Check if user has access to this lesson
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(
                userId, lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to start this lesson");
            }

            // Check if progress already exists
            var progress = await _progressRepository.GetProgressByUserAndLessonAsync(userId, dto.LessonId);

            if (progress == null)
            {
                // Create new progress record
                progress = new LessonProgress
                {
                    UserId = userId,
                    LessonId = dto.LessonId,
                    StartedAt = DateTime.Now,
                    IsCompleted = false
                };

                await _progressRepository.AddAsync(progress);
                await _progressRepository.SaveChangesAsync();
            }
            // If progress exists, we don't need to update anything
        }

        public async Task CompleteLessonAsync(MarkLessonCompleteDto dto, int userId, string userRole)
        {
            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(dto.LessonId);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {dto.LessonId} not found");
            }

            // Check if user has access to this lesson
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(
                userId, lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to complete this lesson");
            }

            // Check if progress already exists
            var progress = await _progressRepository.GetProgressByUserAndLessonAsync(userId, dto.LessonId);

            if (progress == null)
            {
                // Create new progress record and mark as completed
                progress = new LessonProgress
                {
                    UserId = userId,
                    LessonId = dto.LessonId,
                    StartedAt = DateTime.Now,
                    CompletedAt = DateTime.Now,
                    IsCompleted = true
                };

                await _progressRepository.AddAsync(progress);
            }
            else if (!progress.IsCompleted)
            {
                // Update existing progress
                progress.CompletedAt = DateTime.Now;
                progress.IsCompleted = true;
                await _progressRepository.UpdateAsync(progress);
            }

            await _progressRepository.SaveChangesAsync();

            // Check if all lessons in the course are completed
            int courseId = lesson.Module.CourseId;
            bool allCompleted = await _progressRepository.HasCompletedAllLessonsInCourseAsync(userId, courseId);

            // If all lessons are completed, mark the enrollment as completed
            if (allCompleted)
            {
                var enrollments = await _enrollmentRepository.GetEnrollmentsByUserIdAsync(userId);
                var enrollment = enrollments.FirstOrDefault(e => e.CourseId == courseId);

                if (enrollment != null && enrollment.Status != EnrollmentStatus.Completed)
                {
                    enrollment.Status = EnrollmentStatus.Completed;
                    enrollment.CompletionDate = DateTime.Now;
                    await _enrollmentRepository.UpdateAsync(enrollment);
                    await _enrollmentRepository.SaveChangesAsync();
                }
            }
        }

        public async Task UncompleteLessonAsync(MarkLessonCompleteDto dto, int userId, string userRole)
        {
            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(dto.LessonId);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {dto.LessonId} not found");
            }

            // Check if user has access to this lesson
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(
                userId, lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to uncomplete this lesson");
            }

            // Check if progress record exists
            var progress = await _progressRepository.GetProgressByUserAndLessonAsync(userId, dto.LessonId);

            if (progress == null || !progress.IsCompleted)
            {
                throw new BadRequestException("Lesson is not marked as completed");
            }

            // Update progress to uncomplete
            progress.CompletedAt = null;
            progress.IsCompleted = false;
            await _progressRepository.UpdateAsync(progress);

            // Check if the course enrollment is marked as completed
            var enrollments = await _enrollmentRepository.GetEnrollmentsByUserIdAsync(userId);
            var enrollment = enrollments.FirstOrDefault(e => e.CourseId == lesson.Module.CourseId);

            if (enrollment != null && enrollment.Status == EnrollmentStatus.Completed)
            {
                // Update the enrollment status to Active
                enrollment.Status = EnrollmentStatus.Active;
                enrollment.CompletionDate = null;
                await _enrollmentRepository.UpdateAsync(enrollment);
            }

            await _progressRepository.SaveChangesAsync();
        }
    }
}