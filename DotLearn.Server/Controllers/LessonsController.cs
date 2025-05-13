using DotLearn.Server.Common;
using DotLearn.Server.DTOs.Lessons;
using DotLearn.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LessonsController : ControllerBase
    {
        private readonly ILessonService _lessonService;

        public LessonsController(ILessonService lessonService)
        {
            _lessonService = lessonService;
        }

        // GET: api/lessons/module/5
        [HttpGet("module/{moduleId}")]
        [Authorize(Roles = "Instructor,Admin")] // Restrict this endpoint to Instructors and Admins
        public async Task<ActionResult<IEnumerable<LessonDto>>> GetLessonsByModule(int moduleId)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var lessons = await _lessonService.GetLessonsByModuleIdAsync(moduleId, userId, userRole);
                return Ok(lessons);
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
                return StatusCode(500, new { message = "An error occurred while retrieving lessons", error = ex.Message });
            }
        }

        // GET: api/lessons/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDetailDto>> GetLesson(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var lesson = await _lessonService.GetLessonByIdAsync(id, userId, userRole);
                return Ok(lesson);
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
                return StatusCode(500, new { message = "An error occurred while retrieving the lesson", error = ex.Message });
            }
        }

        // POST: api/lessons
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<LessonDto>> CreateLesson(CreateLessonDto lessonDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var lesson = await _lessonService.CreateLessonAsync(lessonDto, userId, userRole);
                return CreatedAtAction(nameof(GetLesson), new { id = lesson.Id }, lesson);
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
                return StatusCode(500, new { message = "An error occurred while creating the lesson", error = ex.Message });
            }
        }

        // PUT: api/lessons/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto lessonDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _lessonService.UpdateLessonAsync(id, lessonDto, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while updating the lesson", error = ex.Message });
            }
        }

        // DELETE: api/lessons/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _lessonService.DeleteLessonAsync(id, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while deleting the lesson", error = ex.Message });
            }
        }
    }
}