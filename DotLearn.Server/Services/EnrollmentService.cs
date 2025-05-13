using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;
using DotLearn.Server.DTOs.Enrollments;

namespace DotLearn.Server.Services
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly IRepository<Course> _courseRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<LessonProgress> _progressRepository;
        private readonly IRepository<QuizAttempt> _quizAttemptRepository;
        private readonly ILessonRepository _lessonRepository;

        public EnrollmentService(
            IEnrollmentRepository enrollmentRepository,
            IRepository<Course> courseRepository,
            IRepository<User> userRepository,
            IRepository<LessonProgress> progressRepository,
            IRepository<QuizAttempt> quizAttemptRepository,
            ILessonRepository lessonRepository)
        {
            _enrollmentRepository = enrollmentRepository;
            _courseRepository = courseRepository;
            _userRepository = userRepository;
            _progressRepository = progressRepository;
            _quizAttemptRepository = quizAttemptRepository;
            _lessonRepository = lessonRepository;
        }

        public async Task<IEnumerable<EnrollmentDto>> GetEnrollmentsAsync(int userId, string userRole)
        {
            IEnumerable<Enrollment> enrollments;

            // For students, return only their own enrollments
            // For instructors, return enrollments for their courses
            // For admins, return all enrollments
            if (userRole == "Student")
            {
                enrollments = await _enrollmentRepository.GetEnrollmentsByUserIdAsync(userId);
            }
            else if (userRole == "Instructor")
            {
                // Get instructor's courses
                var courses = await _courseRepository.GetAllAsync();
                var instructorCourseIds = courses
                    .Where(c => c.InstructorId == userId)
                    .Select(c => c.Id)
                    .ToList();

                // Get enrollments for those courses
                var allEnrollments = await _enrollmentRepository.GetAllAsync();
                enrollments = allEnrollments
                    .Where(e => instructorCourseIds.Contains(e.CourseId))
                    .ToList();
            }
            else // Admin
            {
                enrollments = await _enrollmentRepository.GetAllAsync();
            }

            var result = new List<EnrollmentDto>();
            foreach (var enrollment in enrollments)
            {
                // Get user and course details
                var user = await _userRepository.GetByIdAsync(enrollment.UserId);
                var course = await _courseRepository.GetByIdAsync(enrollment.CourseId);
                var instructor = await _userRepository.GetByIdAsync(course.InstructorId);

                result.Add(new EnrollmentDto
                {
                    Id = enrollment.Id,
                    UserId = enrollment.UserId,
                    UserName = $"{user.FirstName} {user.LastName}",
                    CourseId = enrollment.CourseId,
                    CourseTitle = course.Title,
                    InstructorName = $"{instructor.FirstName} {instructor.LastName}",
                    EnrollmentDate = enrollment.EnrollmentDate,
                    Status = enrollment.Status.ToString(),
                    CompletionDate = enrollment.CompletionDate
                });
            }

            return result;
        }

        public async Task<IEnumerable<CourseDto>> GetEnrolledCoursesAsync(int userId)
        {
            var enrolledCourses = await _enrollmentRepository.GetEnrolledCoursesForUserAsync(userId);
            var result = new List<CourseDto>();

            foreach (var course in enrolledCourses)
            {
                var enrollment = (await _enrollmentRepository.GetAllAsync())
                    .FirstOrDefault(e => e.UserId == userId && e.CourseId == course.Id);

                if (enrollment != null)
                {
                    var instructor = await _userRepository.GetByIdAsync(course.InstructorId);

                    result.Add(new CourseDto
                    {
                        Id = course.Id,
                        Title = course.Title,
                        Description = course.Description,
                        InstructorId = course.InstructorId,
                        InstructorName = $"{instructor.FirstName} {instructor.LastName}",
                        Status = enrollment.Status.ToString(),
                        EnrollmentDate = enrollment.EnrollmentDate,
                        CompletionDate = enrollment.CompletionDate,
                        EnrollmentId = enrollment.Id
                    });
                }
            }

            return result;
        }

        public async Task<EnrollmentDto> EnrollInCourseAsync(EnrollCourseDto enrollDto, int userId)
        {
            // Check if the course exists
            var course = await _courseRepository.GetByIdAsync(enrollDto.CourseId);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {enrollDto.CourseId} not found");
            }

            // Check if already enrolled
            bool alreadyEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(userId, enrollDto.CourseId);
            if (alreadyEnrolled)
            {
                throw new BadRequestException("Already enrolled in this course");
            }

            var enrollment = new Enrollment
            {
                UserId = userId,
                CourseId = enrollDto.CourseId,
                EnrollmentDate = DateTime.Now,
                Status = EnrollmentStatus.Active
            };

            await _enrollmentRepository.AddAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            var user = await _userRepository.GetByIdAsync(userId);
            var instructor = await _userRepository.GetByIdAsync(course.InstructorId);

            return new EnrollmentDto
            {
                Id = enrollment.Id,
                UserId = enrollment.UserId,
                UserName = $"{user.FirstName} {user.LastName}",
                CourseId = enrollment.CourseId,
                CourseTitle = course.Title,
                InstructorName = $"{instructor.FirstName} {instructor.LastName}",
                EnrollmentDate = enrollment.EnrollmentDate,
                Status = enrollment.Status.ToString(),
                CompletionDate = enrollment.CompletionDate
            };
        }

        public async Task UpdateEnrollmentStatusAsync(int id, UpdateEnrollmentDto updateDto, int userId, string userRole)
        {
            var enrollment = await _enrollmentRepository.GetEnrollmentWithDetailsAsync(id);
            if (enrollment == null)
            {
                throw new NotFoundException($"Enrollment with ID {id} not found");
            }

            // Check if user has permission to update this enrollment
            if (enrollment.UserId != userId && userRole != "Admin" &&
                !(userRole == "Instructor" && enrollment.Course.InstructorId == userId))
            {
                throw new UnauthorizedException("You don't have permission to update this enrollment");
            }

            // Update status
            if (Enum.TryParse<EnrollmentStatus>(updateDto.Status, out var status))
            {
                enrollment.Status = status;

                // If status is completed, set completion date and mark all lessons as complete
                if (status == EnrollmentStatus.Completed)
                {
                    enrollment.CompletionDate = DateTime.Now;

                    // Get all lessons for this course
                    var lessons = await _lessonRepository.GetAllAsync();
                    var courseLessons = lessons
                        .Where(l => l.Module.CourseId == enrollment.CourseId)
                        .ToList();

                    var progressRecords = await _progressRepository.GetAllAsync();

                    foreach (var lesson in courseLessons)
                    {
                        // Check if progress record exists
                        var progress = progressRecords
                            .FirstOrDefault(lp => lp.UserId == enrollment.UserId && lp.LessonId == lesson.Id);

                        if (progress == null)
                        {
                            // Create new progress record and mark as completed
                            progress = new LessonProgress
                            {
                                UserId = enrollment.UserId,
                                LessonId = lesson.Id,
                                StartedAt = DateTime.Now,
                                CompletedAt = DateTime.Now,
                                IsCompleted = true
                            };

                            await _progressRepository.AddAsync(progress);
                        }
                        else if (!progress.IsCompleted)
                        {
                            // Update existing progress to completed
                            progress.CompletedAt = DateTime.Now;
                            progress.IsCompleted = true;
                            await _progressRepository.UpdateAsync(progress);
                        }
                    }
                }
                else
                {
                    enrollment.CompletionDate = null;
                }

                await _enrollmentRepository.UpdateAsync(enrollment);
                await _enrollmentRepository.SaveChangesAsync();
            }
            else
            {
                throw new BadRequestException("Invalid status");
            }
        }

        public async Task DeleteEnrollmentAsync(int id, int userId, string userRole)
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(id);
            if (enrollment == null)
            {
                throw new NotFoundException($"Enrollment with ID {id} not found");
            }

            // Check if user has permission to delete this enrollment
            if (enrollment.UserId != userId && userRole != "Admin")
            {
                throw new UnauthorizedException("You don't have permission to delete this enrollment");
            }

            // Find all lessons for this course
            var lessons = await _lessonRepository.GetAllAsync();
            var lessonIds = lessons
                .Where(l => l.Module.CourseId == enrollment.CourseId)
                .Select(l => l.Id)
                .ToList();

            // Delete all progress records for these lessons for this user
            var progressRecords = await _progressRepository.GetAllAsync();
            var progressToDelete = progressRecords
                .Where(lp => lp.UserId == enrollment.UserId && lessonIds.Contains(lp.LessonId))
                .ToList();

            foreach (var progress in progressToDelete)
            {
                await _progressRepository.DeleteAsync(progress);
            }

            // Delete quiz attempts as well if they exist
            var quizAttempts = await _quizAttemptRepository.GetAllAsync();
            var attemptsToDelete = quizAttempts
                .Where(qa => qa.UserId == enrollment.UserId && lessonIds.Contains(qa.LessonId))
                .ToList();

            foreach (var attempt in attemptsToDelete)
            {
                await _quizAttemptRepository.DeleteAsync(attempt);
            }

            // Delete the enrollment
            await _enrollmentRepository.DeleteAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();
        }

        public async Task<EnrollmentDto> AdminEnrollStudentAsync(AdminEnrollDto enrollDto)
        {
            // Check if the course exists
            var course = await _courseRepository.GetByIdAsync(enrollDto.CourseId);
            if (course == null)
            {
                throw new NotFoundException($"Course with ID {enrollDto.CourseId} not found");
            }

            // Check if the user exists
            var user = await _userRepository.GetByIdAsync(enrollDto.UserId);
            if (user == null)
            {
                throw new NotFoundException($"User with ID {enrollDto.UserId} not found");
            }

            // Check if already enrolled
            bool alreadyEnrolled = await _enrollmentRepository.IsUserEnrolledInCourseAsync(
                enrollDto.UserId, enrollDto.CourseId);

            if (alreadyEnrolled)
            {
                throw new BadRequestException("Student is already enrolled in this course");
            }

            var enrollment = new Enrollment
            {
                UserId = enrollDto.UserId,
                CourseId = enrollDto.CourseId,
                EnrollmentDate = DateTime.Now,
                Status = EnrollmentStatus.Active
            };

            await _enrollmentRepository.AddAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            var instructor = await _userRepository.GetByIdAsync(course.InstructorId);

            return new EnrollmentDto
            {
                Id = enrollment.Id,
                UserId = enrollment.UserId,
                UserName = $"{user.FirstName} {user.LastName}",
                CourseId = enrollment.CourseId,
                CourseTitle = course.Title,
                InstructorName = $"{instructor.FirstName} {instructor.LastName}",
                EnrollmentDate = enrollment.EnrollmentDate,
                Status = enrollment.Status.ToString(),
                CompletionDate = enrollment.CompletionDate
            };
        }

        public async Task AdminUnenrollStudentAsync(AdminEnrollDto unenrollDto)
        {
            // Find the enrollment
            var enrollments = await _enrollmentRepository.GetAllAsync();
            var enrollment = enrollments
                .FirstOrDefault(e => e.UserId == unenrollDto.UserId && e.CourseId == unenrollDto.CourseId);

            if (enrollment == null)
            {
                throw new NotFoundException("Enrollment not found");
            }

            // Find all lessons for this course
            var lessons = await _lessonRepository.GetAllAsync();
            var lessonIds = lessons
                .Where(l => l.Module.CourseId == enrollment.CourseId)
                .Select(l => l.Id)
                .ToList();

            // Delete all progress records for these lessons for this user
            var progressRecords = await _progressRepository.GetAllAsync();
            var progressToDelete = progressRecords
                .Where(lp => lp.UserId == enrollment.UserId && lessonIds.Contains(lp.LessonId))
                .ToList();

            foreach (var progress in progressToDelete)
            {
                await _progressRepository.DeleteAsync(progress);
            }

            // Delete quiz attempts as well if they exist
            var quizAttempts = await _quizAttemptRepository.GetAllAsync();
            var attemptsToDelete = quizAttempts
                .Where(qa => qa.UserId == enrollment.UserId && lessonIds.Contains(qa.LessonId))
                .ToList();

            foreach (var attempt in attemptsToDelete)
            {
                await _quizAttemptRepository.DeleteAsync(attempt);
            }

            // Delete the enrollment
            await _enrollmentRepository.DeleteAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();
        }
    }
}