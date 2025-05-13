using DotLearn.Server.Common;
using DotLearn.Server.DTOs.Quizzes;
using DotLearn.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuizzesController : ControllerBase
    {
        private readonly IQuizService _quizService;

        public QuizzesController(IQuizService quizService)
        {
            _quizService = quizService;
        }

        // GET: api/quizzes/lesson/5
        [HttpGet("lesson/{lessonId}")]
        public async Task<ActionResult<QuizDto>> GetQuizByLesson(int lessonId)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var quiz = await _quizService.GetQuizByLessonAsync(lessonId, userId, userRole);
                return Ok(quiz);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the quiz", error = ex.Message });
            }
        }

        // POST: api/quizzes/submit
        [HttpPost("submit")]
        public async Task<ActionResult<QuizResultDto>> SubmitQuiz(SubmitQuizDto submitQuizDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var result = await _quizService.SubmitQuizAsync(submitQuizDto, userId, userRole);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while submitting the quiz", error = ex.Message });
            }
        }

        // POST: api/quizzes/lesson/5/questions
        [HttpPost("lesson/{lessonId}/questions")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<QuizQuestionDto>> AddQuizQuestion(int lessonId, [FromBody] QuizQuestionDto questionDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var question = await _quizService.AddQuizQuestionAsync(lessonId, questionDto, userId, userRole);
                return CreatedAtAction(nameof(GetQuizByLesson), new { lessonId }, question);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the question", error = ex.Message });
            }
        }

        // Continue with other controller methods following the same pattern...
    }
}