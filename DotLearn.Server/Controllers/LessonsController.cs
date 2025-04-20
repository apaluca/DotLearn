using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Lessons;
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
    public class LessonsController : ControllerBase
    {
        private readonly LmsDbContext _context;

        public LessonsController(LmsDbContext context)
        {
            _context = context;
        }

        // GET: api/lessons/module/5
        [HttpGet("module/{moduleId}")]
        [Authorize(Roles = "Instructor,Admin")] // Restrict this endpoint to Instructors and Admins
        public async Task<ActionResult<IEnumerable<LessonDto>>> GetLessonsByModule(int moduleId)
        {
            // Check if module exists
            var module = await _context.Modules
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == moduleId);

            if (module == null)
            {
                return NotFound("Module not found");
            }

            // Check if user has access to this module's course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (module.Course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            var lessons = await _context.Lessons
                .Where(l => l.ModuleId == moduleId)
                .OrderBy(l => l.OrderIndex)
                .Select(l => new LessonDto
                {
                    Id = l.Id,
                    Title = l.Title,
                    ModuleId = l.ModuleId,
                    OrderIndex = l.OrderIndex,
                    Type = l.Type.ToString()
                })
                .ToListAsync();

            return lessons;
        }

        // GET: api/lessons/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDetailDto>> GetLesson(int id)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lesson == null)
            {
                return NotFound();
            }

            // Get user info
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Check if user has access to this lesson's course
            // Users can access lesson content if:
            // 1. They are the instructor of the course, OR
            // 2. They are an admin, OR
            // 3. They are enrolled in the course
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";
            bool isEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == lesson.Module.CourseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }

            var lessonDetail = new LessonDetailDto
            {
                Id = lesson.Id,
                Title = lesson.Title,
                Content = lesson.Content,
                ModuleId = lesson.ModuleId,
                OrderIndex = lesson.OrderIndex,
                Type = lesson.Type.ToString(),
                ModuleTitle = lesson.Module.Title,
                CourseId = lesson.Module.CourseId,
                CourseTitle = lesson.Module.Course.Title
            };

            return lessonDetail;
        }

        // POST: api/lessons
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")] // Restrict this endpoint to Instructors and Admins
        public async Task<ActionResult<LessonDto>> CreateLesson(CreateLessonDto lessonDto)
        {
            // Check if module exists
            var module = await _context.Modules
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == lessonDto.ModuleId);

            if (module == null)
            {
                return NotFound("Module not found");
            }

            // Check if user has access to this module's course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (module.Course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            // Parse lesson type
            if (!Enum.TryParse<LessonType>(lessonDto.Type, out var lessonType))
            {
                return BadRequest("Invalid lesson type");
            }

            // Determine the next order index
            int nextOrderIndex = 1;
            var lastLesson = await _context.Lessons
                .Where(l => l.ModuleId == lessonDto.ModuleId)
                .OrderByDescending(l => l.OrderIndex)
                .FirstOrDefaultAsync();

            if (lastLesson != null)
            {
                nextOrderIndex = lastLesson.OrderIndex + 1;
            }

            var lesson = new Lesson
            {
                Title = lessonDto.Title,
                Content = lessonDto.Content,
                ModuleId = lessonDto.ModuleId,
                OrderIndex = nextOrderIndex,
                Type = lessonType
            };

            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLesson), new { id = lesson.Id }, new LessonDto
            {
                Id = lesson.Id,
                Title = lesson.Title,
                ModuleId = lesson.ModuleId,
                OrderIndex = lesson.OrderIndex,
                Type = lesson.Type.ToString()
            });
        }

        // PUT: api/lessons/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")] // Restrict this endpoint to Instructors and Admins
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto lessonDto)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lesson == null)
            {
                return NotFound();
            }

            // Check if user has access to this lesson's course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (lesson.Module.Course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            lesson.Title = lessonDto.Title;
            lesson.Content = lessonDto.Content;

            // Parse and update lesson type if provided
            if (!string.IsNullOrEmpty(lessonDto.Type) && Enum.TryParse<LessonType>(lessonDto.Type, out var lessonType))
            {
                lesson.Type = lessonType;
            }

            // If order index is provided and different
            if (lessonDto.OrderIndex.HasValue && lessonDto.OrderIndex.Value != lesson.OrderIndex)
            {
                // Reorder lessons
                await ReorderLessons(lesson.ModuleId, id, lesson.OrderIndex, lessonDto.OrderIndex.Value);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LessonExists(id))
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

        // DELETE: api/lessons/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor,Admin")] // Restrict this endpoint to Instructors and Admins
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lesson == null)
            {
                return NotFound();
            }

            // Check if user has access to this lesson's course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (lesson.Module.Course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            // Get current order index for reordering
            int currentOrderIndex = lesson.OrderIndex;
            int moduleId = lesson.ModuleId;

            _context.Lessons.Remove(lesson);
            await _context.SaveChangesAsync();

            // Reorder remaining lessons
            var lessonsToUpdate = await _context.Lessons
                .Where(l => l.ModuleId == moduleId && l.OrderIndex > currentOrderIndex)
                .ToListAsync();

            foreach (var l in lessonsToUpdate)
            {
                l.OrderIndex--;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LessonExists(int id)
        {
            return _context.Lessons.Any(e => e.Id == id);
        }

        private async Task ReorderLessons(int moduleId, int lessonId, int oldIndex, int newIndex)
        {
            if (oldIndex == newIndex)
                return;

            var lessons = await _context.Lessons
                .Where(l => l.ModuleId == moduleId && l.Id != lessonId)
                .OrderBy(l => l.OrderIndex)
                .ToListAsync();

            // Insert at the new index and shift others
            if (oldIndex < newIndex)
            {
                // Moving down - shift lessons up
                foreach (var l in lessons)
                {
                    if (l.OrderIndex > oldIndex && l.OrderIndex <= newIndex)
                    {
                        l.OrderIndex--;
                    }
                }
            }
            else
            {
                // Moving up - shift lessons down
                foreach (var l in lessons)
                {
                    if (l.OrderIndex >= newIndex && l.OrderIndex < oldIndex)
                    {
                        l.OrderIndex++;
                    }
                }
            }

            // Update the lesson being reordered
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson != null)
            {
                lesson.OrderIndex = newIndex;
            }
        }
    }
}