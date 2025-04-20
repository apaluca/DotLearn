using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Enrollments;
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
    public class EnrollmentsController : ControllerBase
    {
        private readonly LmsDbContext _context;

        public EnrollmentsController(LmsDbContext context)
        {
            _context = context;
        }

        // GET: api/enrollments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetEnrollments()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // For students, return only their own enrollments
            // For instructors, return enrollments for their courses
            // For admins, return all enrollments

            IQueryable<Enrollment> enrollmentsQuery = _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor);

            if (userRole == "Student")
            {
                enrollmentsQuery = enrollmentsQuery.Where(e => e.UserId == userId);
            }
            else if (userRole == "Instructor")
            {
                enrollmentsQuery = enrollmentsQuery.Where(e => e.Course.InstructorId == userId);
            }
            // For Admin, no filtering needed

            var enrollments = await enrollmentsQuery
                .Select(e => new EnrollmentDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    UserName = $"{e.User.FirstName} {e.User.LastName}",
                    CourseId = e.CourseId,
                    CourseTitle = e.Course.Title,
                    InstructorName = $"{e.Course.Instructor.FirstName} {e.Course.Instructor.LastName}",
                    EnrollmentDate = e.EnrollmentDate,
                    Status = e.Status.ToString(),
                    CompletionDate = e.CompletionDate
                })
                .ToListAsync();

            return enrollments;
        }

        // GET: api/enrollments/courses
        [HttpGet("courses")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetEnrolledCourses()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var enrolledCourses = await _context.Enrollments
                .Where(e => e.UserId == userId)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor)
                .Select(e => new CourseDto
                {
                    Id = e.Course.Id,
                    Title = e.Course.Title,
                    Description = e.Course.Description,
                    InstructorId = e.Course.InstructorId,
                    InstructorName = $"{e.Course.Instructor.FirstName} {e.Course.Instructor.LastName}",
                    Status = e.Status.ToString(),
                    EnrollmentDate = e.EnrollmentDate,
                    CompletionDate = e.CompletionDate
                })
                .ToListAsync();

            return enrolledCourses;
        }

        // POST: api/enrollments
        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> EnrollInCourse(EnrollCourseDto enrollDto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Check if the course exists
            var course = await _context.Courses.FindAsync(enrollDto.CourseId);
            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            // Check if already enrolled
            var existingEnrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == enrollDto.CourseId);

            if (existingEnrollment != null)
            {
                return BadRequest(new { message = "Already enrolled in this course" });
            }

            var enrollment = new Enrollment
            {
                UserId = userId,
                CourseId = enrollDto.CourseId,
                EnrollmentDate = DateTime.Now,
                Status = EnrollmentStatus.Active
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId);
            var enrollmentDto = new EnrollmentDto
            {
                Id = enrollment.Id,
                UserId = enrollment.UserId,
                UserName = $"{user.FirstName} {user.LastName}",
                CourseId = enrollment.CourseId,
                CourseTitle = course.Title,
                InstructorName = (await _context.Users.FindAsync(course.InstructorId))?.FirstName + " " + (await _context.Users.FindAsync(course.InstructorId))?.LastName,
                EnrollmentDate = enrollment.EnrollmentDate,
                Status = enrollment.Status.ToString(),
                CompletionDate = enrollment.CompletionDate
            };

            return CreatedAtAction(nameof(GetEnrollments), null, enrollmentDto);
        }

        // PUT: api/enrollments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEnrollmentStatus(int id, UpdateEnrollmentDto updateDto)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Check if user has permission to update this enrollment
            if (enrollment.UserId != userId && userRole != "Admin" &&
                !(userRole == "Instructor" && await _context.Courses.AnyAsync(c => c.Id == enrollment.CourseId && c.InstructorId == userId)))
            {
                return Forbid();
            }

            // Update status
            if (Enum.TryParse<EnrollmentStatus>(updateDto.Status, out var status))
            {
                enrollment.Status = status;

                // If status is completed, set completion date
                if (status == EnrollmentStatus.Completed)
                {
                    enrollment.CompletionDate = DateTime.Now;
                }
                else
                {
                    enrollment.CompletionDate = null;
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            else
            {
                return BadRequest(new { message = "Invalid status" });
            }
        }

        // DELETE: api/enrollments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Check if user has permission to delete this enrollment
            if (enrollment.UserId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
