using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;
using DotLearn.Server.DTOs.Courses;

namespace DotLearn.Server.Services
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IProgressRepository _progressRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;

        public CourseService(
            ICourseRepository courseRepository,
            IRepository<User> userRepository,
            IProgressRepository progressRepository,
            IEnrollmentRepository enrollmentRepository)
        {
            _courseRepository = courseRepository;
            _userRepository = userRepository;
            _progressRepository = progressRepository;
            _enrollmentRepository = enrollmentRepository;
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
                    InstructorName = instructor != null ? $"{instructor.FirstName} {instructor.LastName}" : "Unknown Instructor",
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
                InstructorName = instructor != null ? $"{instructor.FirstName} {instructor.LastName}" : "Unknown Instructor",
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

            // Get course with all its modules and lessons to calculate total lessons
            var courseDetails = await _courseRepository.GetCourseWithDetailsAsync(id);
            int totalLessons = courseDetails?.Modules.Sum(m => m.Lessons.Count) ?? 0;

            // Get all enrollments for this course
            var enrollments = await _enrollmentRepository.GetEnrollmentsByCourseIdAsync(id);

            var studentProgressList = new List<StudentProgressDto>();
            int completedCount = 0;
            double totalProgressPercentage = 0;

            foreach (var enrollment in enrollments)
            {
                // Get user details
                var user = await _userRepository.GetByIdAsync(enrollment.UserId);
                if (user == null) continue;

                // Get completed lessons count for this student
                int completedLessons = await _progressRepository.GetCompletedLessonsCountAsync(enrollment.UserId, id);

                // Calculate progress percentage
                double progressPercentage = totalLessons > 0 ? (double)completedLessons / totalLessons * 100 : 0;
                totalProgressPercentage += progressPercentage;

                // Count completed courses
                if (enrollment.Status == EnrollmentStatus.Completed)
                {
                    completedCount++;
                }

                studentProgressList.Add(new StudentProgressDto
                {
                    UserId = user.Id,
                    Username = user.Username,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    EnrollmentDate = enrollment.EnrollmentDate,
                    Status = enrollment.Status.ToString(),
                    CompletionDate = enrollment.CompletionDate,
                    TotalLessons = totalLessons,
                    CompletedLessons = completedLessons,
                    ProgressPercentage = progressPercentage
                });
            }

            // Calculate average progress and completion rate
            double averageProgress = studentProgressList.Count > 0 ? totalProgressPercentage / studentProgressList.Count : 0;
            double completionRate = enrollments.Count() > 0 ? (double)completedCount / enrollments.Count() * 100 : 0;

            return new CourseStudentsDto
            {
                CourseId = id,
                CourseTitle = course.Title,
                TotalStudents = enrollments.Count(),
                AverageProgress = averageProgress,
                CompletionRate = completionRate,
                Students = studentProgressList
            };
        }
    }
}