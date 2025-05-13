using DotLearn.Server.Common;
using DotLearn.Server.DTOs.Enrollments;
using DotLearn.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        public EnrollmentsController(IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

        // GET: api/enrollments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetEnrollments()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var enrollments = await _enrollmentService.GetEnrollmentsAsync(userId, userRole);
                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving enrollments", error = ex.Message });
            }
        }

        // GET: api/enrollments/courses
        [HttpGet("courses")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetEnrolledCourses()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var enrolledCourses = await _enrollmentService.GetEnrolledCoursesAsync(userId);
                return Ok(enrolledCourses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving enrolled courses", error = ex.Message });
            }
        }

        // POST: api/enrollments
        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> EnrollInCourse(EnrollCourseDto enrollDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var enrollment = await _enrollmentService.EnrollInCourseAsync(enrollDto, userId);
                return CreatedAtAction(nameof(GetEnrollments), null, enrollment);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while enrolling in the course", error = ex.Message });
            }
        }

        // PUT: api/enrollments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEnrollmentStatus(int id, UpdateEnrollmentDto updateDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _enrollmentService.UpdateEnrollmentStatusAsync(id, updateDto, userId, userRole);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedException)
            {
                return Forbid();
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the enrollment", error = ex.Message });
            }
        }

        // DELETE: api/enrollments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _enrollmentService.DeleteEnrollmentAsync(id, userId, userRole);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the enrollment", error = ex.Message });
            }
        }

        // POST: api/enrollments/admin
        [HttpPost("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<EnrollmentDto>> AdminEnrollStudent([FromBody] AdminEnrollDto enrollDto)
        {
            try
            {
                var enrollment = await _enrollmentService.AdminEnrollStudentAsync(enrollDto);
                return CreatedAtAction(nameof(GetEnrollments), null, enrollment);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while enrolling the student", error = ex.Message });
            }
        }

        // DELETE: api/enrollments/admin
        [HttpDelete("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminUnenrollStudent([FromBody] AdminEnrollDto unenrollDto)
        {
            try
            {
                await _enrollmentService.AdminUnenrollStudentAsync(unenrollDto);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while unenrolling the student", error = ex.Message });
            }
        }
    }
}