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

        // GET: api/quizzes/lesson/{lessonId}
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

        // POST: api/quizzes/lesson/{lessonId}/questions
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

        // PUT: api/quizzes/questions/{id}
        [HttpPut("questions/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromBody] QuizQuestionDto questionDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _quizService.UpdateQuestionAsync(id, questionDto, userId, userRole);
                return NoContent();
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
                return StatusCode(500, new { message = "An error occurred while updating the question", error = ex.Message });
            }
        }

        // DELETE: api/quizzes/questions/{id}
        [HttpDelete("questions/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _quizService.DeleteQuestionAsync(id, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while deleting the question", error = ex.Message });
            }
        }

        // POST: api/quizzes/questions/{questionId}/options
        [HttpPost("questions/{questionId}/options")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<QuizOptionDto>> AddOptionToQuestion(int questionId, [FromBody] QuizOptionDto optionDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var option = await _quizService.AddOptionToQuestionAsync(questionId, optionDto, userId, userRole);
                return Ok(option);
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
                return StatusCode(500, new { message = "An error occurred while adding the option", error = ex.Message });
            }
        }

        // PUT: api/quizzes/options/{id}
        [HttpPut("options/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> UpdateOption(int id, [FromBody] QuizOptionDto optionDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _quizService.UpdateOptionAsync(id, optionDto, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while updating the option", error = ex.Message });
            }
        }

        // DELETE: api/quizzes/options/{id}
        [HttpDelete("options/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> DeleteOption(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _quizService.DeleteOptionAsync(id, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while deleting the option", error = ex.Message });
            }
        }

        // POST: api/quizzes/questions/{questionId}/options/{optionId}/correct
        [HttpPost("questions/{questionId}/options/{optionId}/correct")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> SetCorrectOption(int questionId, int optionId)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _quizService.SetCorrectOptionAsync(optionId, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while setting the correct option", error = ex.Message });
            }
        }

        // POST: api/quizzes/questions/{questionId}/options/{optionId}/toggle
        [HttpPost("questions/{questionId}/options/{optionId}/toggle")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> ToggleCorrectOption(int questionId, int optionId)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _quizService.ToggleCorrectOptionAsync(optionId, userId, userRole);
                return NoContent();
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
                return StatusCode(500, new { message = "An error occurred while toggling the option", error = ex.Message });
            }
        }

        // GET: api/quizzes/attempts/{lessonId}
        [HttpGet("attempts/{lessonId}")]
        public async Task<ActionResult<IEnumerable<QuizAttemptDto>>> GetQuizAttempts(int lessonId)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var attempts = await _quizService.GetQuizAttemptsAsync(lessonId, userId, userRole);
                return Ok(attempts);
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
                return StatusCode(500, new { message = "An error occurred while retrieving quiz attempts", error = ex.Message });
            }
        }
    }
}