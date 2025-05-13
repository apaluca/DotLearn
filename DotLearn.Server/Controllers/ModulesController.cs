using DotLearn.Server.Common;
using DotLearn.Server.DTOs.Modules;
using DotLearn.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Instructor,Admin")]
    public class ModulesController : ControllerBase
    {
        private readonly IModuleService _moduleService;

        public ModulesController(IModuleService moduleService)
        {
            _moduleService = moduleService;
        }

        // GET: api/modules/course/5
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<ModuleDto>>> GetModulesByCourse(int courseId)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var modules = await _moduleService.GetModulesByCourseIdAsync(courseId, userId, userRole);
                return Ok(modules);
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
                return StatusCode(500, new { message = "An error occurred while retrieving modules", error = ex.Message });
            }
        }

        // GET: api/modules/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ModuleDetailDto>> GetModule(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var module = await _moduleService.GetModuleByIdAsync(id, userId, userRole);
                return Ok(module);
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
                return StatusCode(500, new { message = "An error occurred while retrieving the module", error = ex.Message });
            }
        }

        // POST: api/modules
        [HttpPost]
        public async Task<ActionResult<ModuleDto>> CreateModule(CreateModuleDto moduleDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                var module = await _moduleService.CreateModuleAsync(moduleDto, userId, userRole);
                return CreatedAtAction(nameof(GetModule), new { id = module.Id }, module);
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
                return StatusCode(500, new { message = "An error occurred while creating the module", error = ex.Message });
            }
        }

        // PUT: api/modules/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateModule(int id, UpdateModuleDto moduleDto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _moduleService.UpdateModuleAsync(id, moduleDto, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while updating the module", error = ex.Message });
            }
        }

        // DELETE: api/modules/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteModule(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";

                await _moduleService.DeleteModuleAsync(id, userId, userRole);
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
                return StatusCode(500, new { message = "An error occurred while deleting the module", error = ex.Message });
            }
        }
    }
}