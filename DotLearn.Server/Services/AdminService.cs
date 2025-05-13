using DotLearn.Server.Common;
using DotLearn.Server.Data.Repositories;
using DotLearn.Server.Domain.Entities;
using DotLearn.Server.Domain.Enums;
using DotLearn.Server.DTOs.Admin;
using DotLearn.Server.DTOs.Auth;

namespace DotLearn.Server.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepository;
        private readonly IAuthService _authService;
        private readonly ICourseRepository _courseRepository;

        public AdminService(
            IUserRepository userRepository,
            IAuthService authService,
            ICourseRepository courseRepository)
        {
            _userRepository = userRepository;
            _authService = authService;
            _courseRepository = courseRepository;
        }

        public async Task<IEnumerable<UserListDto>> GetUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            var result = new List<UserListDto>();

            foreach (var user in users)
            {
                var coursesCreated = await _userRepository.GetUserCourseCountAsync(user.Id);
                var coursesEnrolled = await _userRepository.GetUserEnrollmentCountAsync(user.Id);

                result.Add(new UserListDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role.ToString(),
                    CreatedAt = user.CreatedAt,
                    CoursesEnrolled = coursesEnrolled,
                    CoursesCreated = coursesCreated
                });
            }

            return result;
        }

        public async Task<UserListDto> GetUserByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new NotFoundException($"User with ID {id} not found");
            }

            var coursesCreated = await _userRepository.GetUserCourseCountAsync(user.Id);
            var coursesEnrolled = await _userRepository.GetUserEnrollmentCountAsync(user.Id);

            return new UserListDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                CoursesEnrolled = coursesEnrolled,
                CoursesCreated = coursesCreated
            };
        }

        public async Task UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new NotFoundException($"User with ID {id} not found");
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
                throw new BadRequestException("Invalid role");
            }

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        public async Task UpdateUserPasswordAsync(int id, UpdatePasswordDto updatePasswordDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new NotFoundException($"User with ID {id} not found");
            }

            // Update password
            user.PasswordHash = _authService.HashPassword(updatePasswordDto.NewPassword);

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        public async Task DeleteUserAsync(int id, int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new NotFoundException($"User with ID {id} not found");
            }

            // Prevent deleting yourself
            if (user.Id == currentUserId)
            {
                throw new BadRequestException("You cannot delete your own account");
            }

            // Check if user has created courses
            bool hasCreatedCourses = await _courseRepository.IsCourseInstructorAsync(id, id);
            if (hasCreatedCourses)
            {
                throw new BadRequestException("Cannot delete user with created courses. Please reassign or delete the courses first.");
            }

            // Delete user (enrollments should be handled by cascade delete)
            await _userRepository.DeleteAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        public async Task<UserListDto> CreateUserAsync(RegisterModel registerModel, string? role)
        {
            role ??= "Student";

            // Check if username already exists
            bool isUsernameUnique = await _userRepository.IsUsernameUniqueAsync(registerModel.Username);
            if (!isUsernameUnique)
            {
                throw new BadRequestException("Username already exists");
            }

            // Check if email already exists
            bool isEmailUnique = await _userRepository.IsEmailUniqueAsync(registerModel.Email);
            if (!isEmailUnique)
            {
                throw new BadRequestException("Email already registered");
            }

            // Default to Student role if not specified or invalid
            UserRole userRole = UserRole.Student;
            if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var parsedRole))
            {
                userRole = parsedRole;
            }

            var user = new User
            {
                Username = registerModel.Username,
                Email = registerModel.Email,
                PasswordHash = _authService.HashPassword(registerModel.Password),
                FirstName = registerModel.FirstName,
                LastName = registerModel.LastName,
                Role = userRole,
                CreatedAt = DateTime.Now
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            return new UserListDto
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
            };
        }
    }
}