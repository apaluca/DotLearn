using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Admin;
using DotLearn.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly LmsDbContext _context;

        public AdminController(LmsDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new UserListDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    CreatedAt = u.CreatedAt,
                    CoursesEnrolled = u.Enrollments.Count,
                    CoursesCreated = u.InstructorCourses.Count
                })
                .ToListAsync();

            return users;
        }

        // GET: api/admin/users/5
        [HttpGet("users/{id}")]
        public async Task<ActionResult<UserListDto>> GetUser(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new UserListDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    CreatedAt = u.CreatedAt,
                    CoursesEnrolled = u.Enrollments.Count,
                    CoursesCreated = u.InstructorCourses.Count
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // PUT: api/admin/users/5
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Update user details
            user.FirstName = updateUserDto.FirstName;
            user.LastName = updateUserDto.LastName;
            user.Email = updateUserDto.Email;

            // Update role if valid
            if (Enum.TryParse<UserRole>(updateUserDto.Role, out var role))
            {
                user.Role = role;
            }
            else
            {
                return BadRequest(new { message = "Invalid role" });
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/admin/users/5/password
        [HttpPut("users/{id}/password")]
        public async Task<IActionResult> UpdateUserPassword(int id, UpdatePasswordDto updatePasswordDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Update password
            user.PasswordHash = HashPassword(updatePasswordDto.NewPassword);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/admin/users/5
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Get current user ID
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Prevent deleting yourself
            if (user.Id == currentUserId)
            {
                return BadRequest(new { message = "You cannot delete your own account" });
            }

            // Check if user has created courses
            if (await _context.Courses.AnyAsync(c => c.InstructorId == id))
            {
                return BadRequest(new { message = "Cannot delete user with created courses. Please reassign or delete the courses first." });
            }

            // Delete user's enrollments first to avoid foreign key constraints
            var enrollments = await _context.Enrollments.Where(e => e.UserId == id).ToListAsync();
            _context.Enrollments.RemoveRange(enrollments);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/admin/users
        [HttpPost("users")]
        public async Task<ActionResult<UserListDto>> CreateUser(DTOs.Auth.RegisterModel registerModel)
        {
            if (await _context.Users.AnyAsync(u => u.Username == registerModel.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            if (await _context.Users.AnyAsync(u => u.Email == registerModel.Email))
            {
                return BadRequest(new { message = "Email already registered" });
            }

            // Default to Student role if not specified or invalid
            UserRole role = UserRole.Student;
            if (Request.Headers.ContainsKey("X-User-Role"))
            {
                string roleString = Request.Headers["X-User-Role"];
                if (Enum.TryParse<UserRole>(roleString, out var parsedRole))
                {
                    role = parsedRole;
                }
            }

            var user = new User
            {
                Username = registerModel.Username,
                Email = registerModel.Email,
                PasswordHash = HashPassword(registerModel.Password),
                FirstName = registerModel.FirstName,
                LastName = registerModel.LastName,
                Role = role,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Created("", new UserListDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                CoursesEnrolled = 0,
                CoursesCreated = 0
            });
        }

        private string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = new byte[128 / 8];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password with the salt
            string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));

            // Combine the salt and hash for storage
            return $"{Convert.ToBase64String(salt)}:{hashed}";
        }
    }
}
