using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.DTOs.Modules;
using DotLearn.Server.Models;

namespace DotLearn.Server.Services
{
    public class ModuleService : IModuleService
    {
        private readonly IModuleRepository _moduleRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly IRepository<Enrollment> _enrollmentRepository;

        public ModuleService(
            IModuleRepository moduleRepository,
            ICourseRepository courseRepository,
            IRepository<Enrollment> enrollmentRepository)
        {
            _moduleRepository = moduleRepository;
            _courseRepository = courseRepository;
            _enrollmentRepository = enrollmentRepository;
        }

        public async Task<IEnumerable<ModuleDto>> GetModulesByCourseIdAsync(int courseId, int userId, string userRole)
        {
            // Check if course exists
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {courseId} not found");
            }

            // Check if user has access to this course
            bool isInstructor = course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to view this course's modules");
            }

            var modules = await _moduleRepository.GetModulesByCourseIdAsync(courseId);
            var result = new List<ModuleDto>();

            foreach (var module in modules)
            {
                var lessonCount = await _moduleRepository.GetLessonCountAsync(module.Id);

                result.Add(new ModuleDto
                {
                    Id = module.Id,
                    Title = module.Title,
                    CourseId = module.CourseId,
                    OrderIndex = module.OrderIndex,
                    LessonCount = lessonCount
                });
            }

            return result;
        }

        public async Task<ModuleDetailDto> GetModuleByIdAsync(int id, int userId, string userRole)
        {
            var module = await _moduleRepository.GetModuleWithDetailsAsync(id);
            if (module == null)
            {
                throw new NotFoundException($"Module with ID {id} not found");
            }

            // Check if user has access to this module's course
            bool isInstructor = module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to view this module");
            }

            return new ModuleDetailDto
            {
                Id = module.Id,
                Title = module.Title,
                CourseId = module.CourseId,
                OrderIndex = module.OrderIndex,
                LessonCount = module.Lessons.Count,
                Lessons = module.Lessons.Select(l => new LessonDto
                {
                    Id = l.Id,
                    Title = l.Title,
                    OrderIndex = l.OrderIndex,
                    Type = l.Type.ToString()
                }).ToList()
            };
        }

        public async Task<ModuleDto> CreateModuleAsync(CreateModuleDto moduleDto, int userId, string userRole)
        {
            // Check if course exists
            var course = await _courseRepository.GetByIdAsync(moduleDto.CourseId);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {moduleDto.CourseId} not found");
            }

            // Check if user has access to this course
            bool isInstructor = course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to create modules for this course");
            }

            // Determine the next order index
            int nextOrderIndex = 1;
            var modules = await _moduleRepository.GetModulesByCourseIdAsync(moduleDto.CourseId);
            if (modules.Any())
            {
                nextOrderIndex = modules.Max(m => m.OrderIndex) + 1;
            }

            var module = new Module
            {
                Title = moduleDto.Title,
                CourseId = moduleDto.CourseId,
                OrderIndex = nextOrderIndex
            };

            await _moduleRepository.AddAsync(module);
            await _moduleRepository.SaveChangesAsync();

            // Update any completed enrollments to active
            var completedEnrollments = await _enrollmentRepository.GetAllAsync();
            completedEnrollments = completedEnrollments
                .Where(e => e.CourseId == moduleDto.CourseId && e.Status == EnrollmentStatus.Completed)
                .ToList();

            foreach (var enrollment in completedEnrollments)
            {
                enrollment.Status = EnrollmentStatus.Active;
                enrollment.CompletionDate = null;
                await _enrollmentRepository.UpdateAsync(enrollment);
            }

            await _enrollmentRepository.SaveChangesAsync();

            return new ModuleDto
            {
                Id = module.Id,
                Title = module.Title,
                CourseId = module.CourseId,
                OrderIndex = module.OrderIndex,
                LessonCount = 0
            };
        }

        public async Task UpdateModuleAsync(int id, UpdateModuleDto moduleDto, int userId, string userRole)
        {
            var module = await _moduleRepository.GetModuleWithDetailsAsync(id);
            if (module == null)
            {
                throw new NotFoundException($"Module with ID {id} not found");
            }

            // Check if user has access to this module's course
            bool isInstructor = module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to update this module");
            }

            module.Title = moduleDto.Title;

            // If order index is provided and different
            if (moduleDto.OrderIndex.HasValue && moduleDto.OrderIndex.Value != module.OrderIndex)
            {
                // Reorder modules
                await _moduleRepository.ReorderModulesAsync(
                    module.CourseId, id, module.OrderIndex, moduleDto.OrderIndex.Value);
            }
            else
            {
                await _moduleRepository.UpdateAsync(module);
                await _moduleRepository.SaveChangesAsync();
            }
        }

        public async Task DeleteModuleAsync(int id, int userId, string userRole)
        {
            var module = await _moduleRepository.GetModuleWithDetailsAsync(id);
            if (module == null)
            {
                throw new NotFoundException($"Module with ID {id} not found");
            }

            // Check if user has access to this module's course
            bool isInstructor = module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to delete this module");
            }

            // Get current order index for reordering
            int currentOrderIndex = module.OrderIndex;
            int courseId = module.CourseId;

            await _moduleRepository.DeleteAsync(module);
            await _moduleRepository.SaveChangesAsync();

            // Reorder remaining modules
            var modulesToUpdate = (await _moduleRepository.GetModulesByCourseIdAsync(courseId))
                .Where(m => m.OrderIndex > currentOrderIndex)
                .ToList();

            foreach (var m in modulesToUpdate)
            {
                m.OrderIndex--;
                await _moduleRepository.UpdateAsync(m);
            }

            await _moduleRepository.SaveChangesAsync();
        }
    }
}