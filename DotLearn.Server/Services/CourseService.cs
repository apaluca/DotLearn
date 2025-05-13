using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;
using DotLearn.Server.DTOs.Courses;

namespace DotLearn.Server.Services
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<LessonProgress> _progressRepository;

        public CourseService(
            ICourseRepository courseRepository,
            IRepository<User> userRepository,
            IRepository<LessonProgress> progressRepository)
        {
            _courseRepository = courseRepository;
            _userRepository = userRepository;
            _progressRepository = progressRepository;
        }

        public async Task<IEnumerable<CourseDto>> GetAllCoursesAsync()
        {
            var courses = await _courseRepository.GetAllAsync();
            var result = new List<CourseDto>();

            foreach (var course in courses)
            {
                var instructor = await _userRepository.GetByIdAsync(course.InstructorId);
                var enrollmentCount = await _courseRepository.GetEnrollmentCountAsync(course.Id);

                result.Add(new CourseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    InstructorId = course.InstructorId,
                    InstructorName = $"{instructor.FirstName} {instructor.LastName}",
                    CreatedAt = course.CreatedAt,
                    UpdatedAt = course.UpdatedAt,
                    EnrollmentCount = enrollmentCount
                });
            }

            return result;
        }

        public async Task<CourseDetailDto> GetCourseByIdAsync(int id)
        {
            var course = await _courseRepository.GetCourseWithDetailsAsync(id);

            if (course == null)
            {
                throw new NotFoundException($"Course with ID {id} not found");
            }

            var courseDetail = new CourseDetailDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                InstructorId = course.InstructorId,
                InstructorName = $"{course.Instructor.FirstName} {course.Instructor.LastName}",
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                EnrollmentCount = await _courseRepository.GetEnrollmentCountAsync(course.Id),
                Modules = course.Modules.Select(m => new ModuleDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    OrderIndex = m.OrderIndex,
                    Lessons = m.Lessons.Select(l => new LessonDto
                    {
                        Id = l.Id,
                        Title = l.Title,
                        OrderIndex = l.OrderIndex,
                        Type = l.Type.ToString()
                    }).ToList()
                }).ToList()
            };

            return courseDetail;
        }

        public async Task<CourseDto> CreateCourseAsync(CreateCourseDto courseDto, int instructorId)
        {
            var course = new Course
            {
                Title = courseDto.Title,
                Description = courseDto.Description,
                InstructorId = instructorId,
                CreatedAt = DateTime.Now
            };

            await _courseRepository.AddAsync(course);
            await _courseRepository.SaveChangesAsync();

            var instructor = await _userRepository.GetByIdAsync(instructorId);

            return new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                InstructorId = course.InstructorId,
                InstructorName = $"{instructor.FirstName} {instructor.LastName}",
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                EnrollmentCount = 0
            };
        }

        public async Task UpdateCourseAsync(int id, UpdateCourseDto courseDto, int userId, string userRole)
        {
            var course = await _courseRepository.GetByIdAsync(id);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {id} not found");
            }

            // Check if user is allowed to update this course
            if (course.InstructorId != userId && userRole != "Admin")
            {
                throw new UnauthorizedException("You don't have permission to update this course");
            }

            course.Title = courseDto.Title;
            course.Description = courseDto.Description;
            course.UpdatedAt = DateTime.Now;

            await _courseRepository.UpdateAsync(course);
            await _courseRepository.SaveChangesAsync();
        }

        public async Task DeleteCourseAsync(int id, int userId, string? userRole)
        {
            userRole ??= "Student";

            var course = await _courseRepository.GetByIdAsync(id);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {id} not found");
            }

            // Check if user is allowed to delete this course
            if (course.InstructorId != userId && userRole != "Admin")
            {
                throw new UnauthorizedException("You don't have permission to delete this course");
            }

            await _courseRepository.DeleteAsync(course);
            await _courseRepository.SaveChangesAsync();
        }

        public async Task<CourseStudentsDto> GetCourseStudentsAsync(int id, int userId, string userRole)
        {
            var course = await _courseRepository.GetByIdAsync(id);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {id} not found");
            }

            // Check if user is the instructor of this course or an admin
            if (course.InstructorId != userId && userRole != "Admin")
            {
                throw new UnauthorizedException("You don't have permission to view this course's students");
            }

            // Implementation of student statistics would go here...
            // This would involve querying enrollments, progress, etc.

            // For now, returning a stub implementation
            return new CourseStudentsDto
            {
                CourseId = id,
                CourseTitle = course.Title,
                TotalStudents = await _courseRepository.GetEnrollmentCountAsync(id),
                AverageProgress = 0,
                CompletionRate = 0,
                Students = new List<StudentProgressDto>()
            };
        }
    }
}