using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Courses;
using DotLearn.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly LmsDbContext _context;

        public CoursesController(LmsDbContext context)
        {
            _context = context;
        }

        // GET: api/courses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetCourses()
        {
            var courses = await _context.Courses
                .Include(c => c.Instructor)
                .Select(c => new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    InstructorId = c.InstructorId,
                    InstructorName = $"{c.Instructor.FirstName} {c.Instructor.LastName}",
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    EnrollmentCount = c.Enrollments.Count
                })
                .ToListAsync();

            return courses;
        }

        // GET: api/courses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDetailDto>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Instructor)
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
            {
                return NotFound();
            }

            var courseDetail = new CourseDetailDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                InstructorId = course.InstructorId,
                InstructorName = $"{course.Instructor.FirstName} {course.Instructor.LastName}",
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                Modules = course.Modules.OrderBy(m => m.OrderIndex).Select(m => new ModuleDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    OrderIndex = m.OrderIndex,
                    Lessons = m.Lessons.OrderBy(l => l.OrderIndex).Select(l => new LessonDto
                    {
                        Id = l.Id,
                        Title = l.Title,
                        OrderIndex = l.OrderIndex,
                        Type = l.Type.ToString()
                    }).ToList()
                }).ToList()
            };

            return courseDetail;
        }

        // POST: api/courses
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<CourseDto>> CreateCourse(CreateCourseDto courseDto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var course = new Course
            {
                Title = courseDto.Title,
                Description = courseDto.Description,
                InstructorId = userId,
                CreatedAt = DateTime.Now
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
        }

        // PUT: api/courses/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateCourse(int id, UpdateCourseDto courseDto)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Check if user is allowed to update this course
            if (course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            course.Title = courseDto.Title;
            course.Description = courseDto.Description;
            course.UpdatedAt = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CourseExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/courses/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Check if user is allowed to delete this course
            if (course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/students")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<CourseStudentsDto>> GetCourseStudents(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Check if user is the instructor of this course or an admin
            if (course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            // Get all enrollments for this course
            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == id)
                .Include(e => e.User)
                .ToListAsync();

            // Get progress data for all students
            var students = new List<StudentProgressDto>();
            foreach (var enrollment in enrollments)
            {
                // Get course progress for this student
                var courseProgress = await _context.LessonProgress
                    .Where(lp => lp.UserId == enrollment.UserId && lp.Lesson.Module.CourseId == id)
                    .ToListAsync();

                // Calculate progress statistics
                var totalLessons = await _context.Lessons
                    .CountAsync(l => l.Module.CourseId == id);

                var completedLessons = courseProgress.Count(lp => lp.IsCompleted);
                double progressPercentage = totalLessons > 0
                    ? Math.Round((double)completedLessons / totalLessons * 100, 1)
                    : 0;

                students.Add(new StudentProgressDto
                {
                    UserId = enrollment.UserId,
                    Username = enrollment.User.Username,
                    FirstName = enrollment.User.FirstName,
                    LastName = enrollment.User.LastName,
                    Email = enrollment.User.Email,
                    EnrollmentDate = enrollment.EnrollmentDate,
                    Status = enrollment.Status.ToString(),
                    CompletionDate = enrollment.CompletionDate,
                    TotalLessons = totalLessons,
                    CompletedLessons = completedLessons,
                    ProgressPercentage = progressPercentage
                });
            }

            // Calculate overall statistics
            double averageProgress = students.Count > 0
                ? students.Average(s => s.ProgressPercentage)
                : 0;
            int completedCount = students.Count(s => s.Status == "Completed");
            double completionRate = students.Count > 0
                ? Math.Round((double)completedCount / students.Count * 100, 1)
                : 0;

            return new CourseStudentsDto
            {
                CourseId = id,
                CourseTitle = course.Title,
                TotalStudents = students.Count,
                AverageProgress = averageProgress,
                CompletionRate = completionRate,
                Students = students
            };
        }

        private bool CourseExists(int id)
        {
            return _context.Courses.Any(e => e.Id == id);
        }
    }
}
