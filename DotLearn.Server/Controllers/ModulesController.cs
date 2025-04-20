using DotLearn.Server.Data;
using DotLearn.Server.DTOs.Modules;
using DotLearn.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DotLearn.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Instructor,Admin")]
    public class ModulesController : ControllerBase
    {
        private readonly LmsDbContext _context;

        public ModulesController(LmsDbContext context)
        {
            _context = context;
        }

        // GET: api/modules/course/5
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<ModuleDto>>> GetModulesByCourse(int courseId)
        {
            // Check if course exists
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found");
            }

            // Check if user has access to this course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            var modules = await _context.Modules
                .Where(m => m.CourseId == courseId)
                .OrderBy(m => m.OrderIndex)
                .Select(m => new ModuleDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    CourseId = m.CourseId,
                    OrderIndex = m.OrderIndex,
                    LessonCount = m.Lessons.Count
                })
                .ToListAsync();

            return modules;
        }

        // GET: api/modules/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ModuleDetailDto>> GetModule(int id)
        {
            var module = await _context.Modules
                .Include(m => m.Course)
                .Include(m => m.Lessons.OrderBy(l => l.OrderIndex))
                .FirstOrDefaultAsync(m => m.Id == id);

            if (module == null)
            {
                return NotFound();
            }

            // Check if user has access to this module's course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (module.Course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            var moduleDetail = new ModuleDetailDto
            {
                Id = module.Id,
                Title = module.Title,
                CourseId = module.CourseId,
                OrderIndex = module.OrderIndex,
                Lessons = module.Lessons.Select(l => new LessonDto
                {
                    Id = l.Id,
                    Title = l.Title,
                    OrderIndex = l.OrderIndex,
                    Type = l.Type.ToString()
                }).ToList()
            };

            return moduleDetail;
        }

        // POST: api/modules
        [HttpPost]
        public async Task<ActionResult<ModuleDto>> CreateModule(CreateModuleDto moduleDto)
        {
            // Check if course exists
            var course = await _context.Courses.FindAsync(moduleDto.CourseId);
            if (course == null)
            {
                return NotFound("Course not found");
            }

            // Check if user has access to this course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            // Determine the next order index
            int nextOrderIndex = 1;
            var lastModule = await _context.Modules
                .Where(m => m.CourseId == moduleDto.CourseId)
                .OrderByDescending(m => m.OrderIndex)
                .FirstOrDefaultAsync();

            if (lastModule != null)
            {
                nextOrderIndex = lastModule.OrderIndex + 1;
            }

            var module = new Module
            {
                Title = moduleDto.Title,
                CourseId = moduleDto.CourseId,
                OrderIndex = nextOrderIndex
            };

            _context.Modules.Add(module);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetModule), new { id = module.Id }, new ModuleDto
            {
                Id = module.Id,
                Title = module.Title,
                CourseId = module.CourseId,
                OrderIndex = module.OrderIndex,
                LessonCount = 0
            });
        }

        // PUT: api/modules/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateModule(int id, UpdateModuleDto moduleDto)
        {
            var module = await _context.Modules
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (module == null)
            {
                return NotFound();
            }

            // Check if user has access to this module's course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (module.Course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            module.Title = moduleDto.Title;

            // If order index is provided and different
            if (moduleDto.OrderIndex.HasValue && moduleDto.OrderIndex.Value != module.OrderIndex)
            {
                // Reorder modules
                await ReorderModules(module.CourseId, id, module.OrderIndex, moduleDto.OrderIndex.Value);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ModuleExists(id))
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

        // DELETE: api/modules/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteModule(int id)
        {
            var module = await _context.Modules
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (module == null)
            {
                return NotFound();
            }

            // Check if user has access to this module's course
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (module.Course.InstructorId != userId && userRole != "Admin")
            {
                return Forbid();
            }

            // Get current order index for reordering
            int currentOrderIndex = module.OrderIndex;

            _context.Modules.Remove(module);
            await _context.SaveChangesAsync();

            // Reorder remaining modules
            var modulesToUpdate = await _context.Modules
                .Where(m => m.CourseId == module.CourseId && m.OrderIndex > currentOrderIndex)
                .ToListAsync();

            foreach (var m in modulesToUpdate)
            {
                m.OrderIndex--;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ModuleExists(int id)
        {
            return _context.Modules.Any(e => e.Id == id);
        }

        private async Task ReorderModules(int courseId, int moduleId, int oldIndex, int newIndex)
        {
            if (oldIndex == newIndex)
                return;

            var modules = await _context.Modules
                .Where(m => m.CourseId == courseId && m.Id != moduleId)
                .OrderBy(m => m.OrderIndex)
                .ToListAsync();

            // Insert at the new index and shift others
            if (oldIndex < newIndex)
            {
                // Moving down - shift modules up
                foreach (var m in modules)
                {
                    if (m.OrderIndex > oldIndex && m.OrderIndex <= newIndex)
                    {
                        m.OrderIndex--;
                    }
                }
            }
            else
            {
                // Moving up - shift modules down
                foreach (var m in modules)
                {
                    if (m.OrderIndex >= newIndex && m.OrderIndex < oldIndex)
                    {
                        m.OrderIndex++;
                    }
                }
            }

            // Update the module being reordered
            var module = await _context.Modules.FindAsync(moduleId);
            if (module != null)
            {
                module.OrderIndex = newIndex;
            }
        }
    }
}
