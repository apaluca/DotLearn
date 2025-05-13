using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;
using DotLearn.Server.DTOs.Lessons;

namespace DotLearn.Server.Services
{
    public class LessonService : ILessonService
    {
        private readonly ILessonRepository _lessonRepository;
        private readonly IRepository<Enrollment> _enrollmentRepository;

        public LessonService(
            ILessonRepository lessonRepository,
            IRepository<Enrollment> enrollmentRepository)
        {
            _lessonRepository = lessonRepository;
            _enrollmentRepository = enrollmentRepository;
        }

        public async Task<IEnumerable<LessonDto>> GetLessonsByModuleIdAsync(int moduleId, int userId, string userRole)
        {
            // Check if module exists
            var module = await _lessonRepository.GetModuleWithCourseAsync(moduleId);
            if (module == null)
            {
                throw new NotFoundException($"Module with ID {moduleId} not found");
            }

            // Check if user has access to this module's course
            bool isInstructor = module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to view lessons for this module");
            }

            var lessons = await _lessonRepository.GetLessonsByModuleIdAsync(moduleId);
            return lessons.Select(l => new LessonDto
            {
                Id = l.Id,
                Title = l.Title,
                ModuleId = l.ModuleId,
                OrderIndex = l.OrderIndex,
                Type = l.Type.ToString()
            }).ToList();
        }

        public async Task<LessonDetailDto> GetLessonByIdAsync(int id, int userId, string userRole)
        {
            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(id);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {id} not found");
            }

            // Check if user has access to this lesson's course
            // Users can access lesson content if:
            // 1. They are the instructor of the course, OR
            // 2. They are an admin, OR
            // 3. They are enrolled in the course
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            // Using local variable for better readability
            int courseId = lesson.Module.CourseId;

            // Query enrollments directly to check if user is enrolled
            bool isEnrolled = (await _enrollmentRepository.GetAllAsync())
                .Any(e => e.UserId == userId && e.CourseId == courseId);

            if (!isInstructor && !isAdmin && !isEnrolled)
            {
                throw new UnauthorizedException("You don't have permission to view this lesson");
            }

            return new LessonDetailDto
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
        }

        public async Task<LessonDto> CreateLessonAsync(CreateLessonDto lessonDto, int userId, string userRole)
        {
            // Check if module exists
            var module = await _lessonRepository.GetModuleWithCourseAsync(lessonDto.ModuleId);
            if (module == null)
            {
                throw new NotFoundException($"Module with ID {lessonDto.ModuleId} not found");
            }

            // Check if user has access to this module's course
            bool isInstructor = module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to create lessons for this module");
            }

            // Parse lesson type
            if (!Enum.TryParse<LessonType>(lessonDto.Type, out var lessonType))
            {
                throw new BadRequestException("Invalid lesson type");
            }

            // Determine the next order index
            int nextOrderIndex = 1;
            var lessons = await _lessonRepository.GetLessonsByModuleIdAsync(lessonDto.ModuleId);
            if (lessons.Any())
            {
                nextOrderIndex = lessons.Max(l => l.OrderIndex) + 1;
            }

            var lesson = new Lesson
            {
                Title = lessonDto.Title,
                Content = lessonDto.Content,
                ModuleId = lessonDto.ModuleId,
                OrderIndex = nextOrderIndex,
                Type = lessonType
            };

            await _lessonRepository.AddAsync(lesson);
            await _lessonRepository.SaveChangesAsync();

            // Find the course ID for this module
            var courseId = module.CourseId;

            // Update any completed enrollments to active
            var completedEnrollments = (await _enrollmentRepository.GetAllAsync())
                .Where(e => e.CourseId == courseId && e.Status == EnrollmentStatus.Completed)
                .ToList();

            foreach (var enrollment in completedEnrollments)
            {
                enrollment.Status = EnrollmentStatus.Active;
                enrollment.CompletionDate = null;
                await _enrollmentRepository.UpdateAsync(enrollment);
            }

            await _enrollmentRepository.SaveChangesAsync();

            return new LessonDto
            {
                Id = lesson.Id,
                Title = lesson.Title,
                ModuleId = lesson.ModuleId,
                OrderIndex = lesson.OrderIndex,
                Type = lesson.Type.ToString()
            };
        }

        public async Task UpdateLessonAsync(int id, UpdateLessonDto lessonDto, int userId, string userRole)
        {
            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(id);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {id} not found");
            }

            // Check if user has access to this lesson's course
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to update this lesson");
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
                await _lessonRepository.ReorderLessonsAsync(
                    lesson.ModuleId, id, lesson.OrderIndex, lessonDto.OrderIndex.Value);
            }
            else
            {
                await _lessonRepository.UpdateAsync(lesson);
                await _lessonRepository.SaveChangesAsync();
            }
        }

        public async Task DeleteLessonAsync(int id, int userId, string userRole)
        {
            var lesson = await _lessonRepository.GetLessonWithDetailsAsync(id);
            if (lesson == null)
            {
                throw new NotFoundException($"Lesson with ID {id} not found");
            }

            // Check if user has access to this lesson's course
            bool isInstructor = lesson.Module.Course.InstructorId == userId;
            bool isAdmin = userRole == "Admin";

            if (!isInstructor && !isAdmin)
            {
                throw new UnauthorizedException("You don't have permission to delete this lesson");
            }

            // Get current order index for reordering
            int currentOrderIndex = lesson.OrderIndex;
            int moduleId = lesson.ModuleId;

            await _lessonRepository.DeleteAsync(lesson);
            await _lessonRepository.SaveChangesAsync();

            // Reorder remaining lessons
            var lessonsToUpdate = (await _lessonRepository.GetLessonsByModuleIdAsync(moduleId))
                .Where(l => l.OrderIndex > currentOrderIndex)
                .ToList();

            foreach (var l in lessonsToUpdate)
            {
                l.OrderIndex--;
                await _lessonRepository.UpdateAsync(l);
            }

            await _lessonRepository.SaveChangesAsync();
        }
    }
}