using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Progress;
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
    public class ProgressController : ControllerBase
    {
        private readonly LmsDbContext _context;

        public ProgressController(LmsDbContext context)
        {
            _context = context;
        }

        // GET: api/progress/course/5
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<CourseProgressDto>> GetCourseProgress(int courseId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Check if user has access to this course
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = await _context.Courses.AnyAsync(c => c.Id == courseId && c.InstructorId == userId);
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }

            // Get the course with modules and lessons
            var course = await _context.Courses
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
            {
                return NotFound("Course not found");
            }

            // Get user's progress for all lessons in this course
            var lessonProgress = await _context.LessonProgress
                .Where(lp => lp.UserId == userId && lp.Lesson.Module.CourseId == courseId)
                .ToListAsync();

            // Create progress DTO
            var courseProgress = new CourseProgressDto
            {
                CourseId = course.Id,
                CourseTitle = course.Title,
                TotalLessons = course.Modules.Sum(m => m.Lessons.Count),
                CompletedLessons = lessonProgress.Count(lp => lp.IsCompleted),
                Modules = course.Modules.OrderBy(m => m.OrderIndex).Select(module => new ModuleProgressDto
                {
                    ModuleId = module.Id,
                    ModuleTitle = module.Title,
                    TotalLessons = module.Lessons.Count,
                    CompletedLessons = lessonProgress.Count(lp => lp.IsCompleted && module.Lessons.Any(l => l.Id == lp.LessonId)),
                    Lessons = module.Lessons.OrderBy(l => l.OrderIndex).Select(lesson => new LessonProgressDto
                    {
                        LessonId = lesson.Id,
                        LessonTitle = lesson.Title,
                        ModuleId = module.Id,
                        ModuleTitle = module.Title,
                        IsCompleted = lessonProgress.Any(lp => lp.LessonId == lesson.Id && lp.IsCompleted),
                        StartedAt = lessonProgress.FirstOrDefault(lp => lp.LessonId == lesson.Id)?.StartedAt,
                        CompletedAt = lessonProgress.FirstOrDefault(lp => lp.LessonId == lesson.Id)?.CompletedAt
                    }).ToList()
                }).ToList()
            };

            // Calculate percentages
            foreach (var module in courseProgress.Modules)
            {
                module.ProgressPercentage = module.TotalLessons > 0
                    ? Math.Round((double)module.CompletedLessons / module.TotalLessons * 100, 1)
                    : 0;
            }

            courseProgress.ProgressPercentage = courseProgress.TotalLessons > 0
                ? Math.Round((double)courseProgress.CompletedLessons / courseProgress.TotalLessons * 100, 1)
                : 0;

            return courseProgress;
        }

        // POST: api/progress/lesson/start
        [HttpPost("lesson/start")]
        public async Task<IActionResult> StartLesson(MarkLessonCompleteDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == dto.LessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
            }

            // Check if user has access to this lesson
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }

            // Check if progress already exists
            var progress = await _context.LessonProgress
                .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.LessonId == dto.LessonId);

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

                _context.LessonProgress.Add(progress);
            }
            // If progress exists, we don't need to update anything

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/progress/lesson/complete
        [HttpPost("lesson/complete")]
        public async Task<IActionResult> CompleteLesson(MarkLessonCompleteDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == dto.LessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
            }

            // Check if user has access to this lesson
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }

            // Check if progress already exists
            var progress = await _context.LessonProgress
                .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.LessonId == dto.LessonId);

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

                _context.LessonProgress.Add(progress);
            }
            else if (!progress.IsCompleted)
            {
                // Update existing progress
                progress.CompletedAt = DateTime.Now;
                progress.IsCompleted = true;
            }

            await _context.SaveChangesAsync();

            // Check if all lessons in the course are completed
            var courseId = lesson.Module.CourseId;
            var totalLessons = await _context.Lessons
                .CountAsync(l => l.Module.CourseId == courseId);

            var completedLessons = await _context.LessonProgress
                .CountAsync(lp => lp.UserId == userId && lp.IsCompleted && lp.Lesson.Module.CourseId == courseId);

            // If all lessons are completed, mark the enrollment as completed
            if (totalLessons > 0 && totalLessons == completedLessons)
            {
                var enrollment = await _context.Enrollments
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

                if (enrollment != null && enrollment.Status != EnrollmentStatus.Completed)
                {
                    enrollment.Status = EnrollmentStatus.Completed;
                    enrollment.CompletionDate = DateTime.Now;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // GET: api/progress/overview
        [HttpGet("overview")]
        public async Task<ActionResult<IEnumerable<CourseProgressDto>>> GetProgressOverview()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Get all enrolled courses for the user
            var enrolledCourses = await _context.Enrollments
                .Where(e => e.UserId == userId)
                .Select(e => e.CourseId)
                .ToListAsync();

            // Get all courses with modules and lessons
            var courses = await _context.Courses
                .Where(c => enrolledCourses.Contains(c.Id))
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
                .ToListAsync();

            // Get user's progress for all lessons
            var lessonProgress = await _context.LessonProgress
                .Where(lp => lp.UserId == userId && lp.Lesson.Module.Course.Enrollments.Any(e => e.UserId == userId))
                .ToListAsync();

            // Create progress summaries
            var progressOverview = courses.Select(course =>
            {
                int totalLessons = course.Modules.Sum(m => m.Lessons.Count);
                int completedLessons = lessonProgress.Count(lp =>
                    lp.IsCompleted &&
                    course.Modules.Any(m => m.Lessons.Any(l => l.Id == lp.LessonId))
                );

                return new CourseProgressDto
                {
                    CourseId = course.Id,
                    CourseTitle = course.Title,
                    TotalLessons = totalLessons,
                    CompletedLessons = completedLessons,
                    ProgressPercentage = totalLessons > 0
                        ? Math.Round((double)completedLessons / totalLessons * 100, 1)
                        : 0
                };
            }).ToList();

            return progressOverview;
        }

        // POST: api/progress/lesson/uncomplete
        [HttpPost("lesson/uncomplete")]
        public async Task<IActionResult> UnmarkLesson(MarkLessonCompleteDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == dto.LessonId);

            if (lesson == null)
            {
                return NotFound("Lesson not found");
            }

            // Check if user has access to this lesson
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }

            // Check if progress record exists
            var progress = await _context.LessonProgress
                .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.LessonId == dto.LessonId);

            if (progress == null || !progress.IsCompleted)
            {
                return BadRequest("Lesson is not marked as completed.");
            }

            // Update progress to uncomplete
            progress.CompletedAt = null;
            progress.IsCompleted = false;

            // Check if the course enrollment is marked as completed
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.Module.CourseId);

            if (enrollment != null && enrollment.Status == EnrollmentStatus.Completed)
            {
                // Update the enrollment status to Active
                enrollment.Status = EnrollmentStatus.Active;
                enrollment.CompletionDate = null;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
