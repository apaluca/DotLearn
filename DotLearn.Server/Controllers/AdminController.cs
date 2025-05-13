using DotLearn.Server.Common;
using DotLearn.Server.DTOs.Admin;
using DotLearn.Server.DTOs.Auth;
using DotLearn.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers()
        {
            try
            {
                var users = await _adminService.GetUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving users", error = ex.Message });
            }
        }

        // GET: api/admin/users/5
        [HttpGet("users/{id}")]
        public async Task<ActionResult<UserListDto>> GetUser(int id)
        {
            try
            {
                var user = await _adminService.GetUserByIdAsync(id);
                return Ok(user);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the user", error = ex.Message });
            }
        }

        // PUT: api/admin/users/5
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            try
            {
                await _adminService.UpdateUserAsync(id, updateUserDto);
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the user", error = ex.Message });
            }
        }

        // PUT: api/admin/users/5/password
        [HttpPut("users/{id}/password")]
        public async Task<IActionResult> UpdateUserPassword(int id, UpdatePasswordDto updatePasswordDto)
        {
            try
            {
                await _adminService.UpdateUserPasswordAsync(id, updatePasswordDto);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the user's password", error = ex.Message });
            }
        }

        // DELETE: api/admin/users/5
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user identifier" });
                }
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Student";
                await _adminService.DeleteUserAsync(id, userId);
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the user", error = ex.Message });
            }
        }

        // POST: api/admin/users
        [HttpPost("users")]
        public async Task<ActionResult<UserListDto>> CreateUser(RegisterModel registerModel)
        {
            try
            {
                string role = Request.Headers.ContainsKey("X-User-Role") ? Request.Headers["X-User-Role"].ToString() : string.Empty;

                var user = await _adminService.CreateUserAsync(registerModel, role);
                return Created($"api/admin/users/{user.Id}", user);
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the user", error = ex.Message });
            }
        }
    }
}