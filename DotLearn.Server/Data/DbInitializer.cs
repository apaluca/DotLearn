using DotLearn.Server.Models;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace DotLearn.Server.Data
{
    public static class DbInitializer
    {
        public static void Initialize(LmsDbContext context)
        {
            // Make sure the database is created and all pending migrations are applied
            context.Database.Migrate();

            // Check if the database already has data
            if (context.Users.Any())
            {
                return; // DB has been seeded
            }

            // Seed users
            var admin = new User
            {
                Username = "admin",
                Email = "admin@dotlearn.com",
                PasswordHash = HashPassword("Admin123!"),
                FirstName = "Admin",
                LastName = "User",
                Role = UserRole.Admin,
                CreatedAt = DateTime.Now
            };

            var instructor = new User
            {
                Username = "instructor",
                Email = "instructor@dotlearn.com",
                PasswordHash = HashPassword("Instructor123!"),
                FirstName = "John",
                LastName = "Doe",
                Role = UserRole.Instructor,
                CreatedAt = DateTime.Now
            };

            var student = new User
            {
                Username = "student",
                Email = "student@dotlearn.com",
                PasswordHash = HashPassword("Student123!"),
                FirstName = "Jane",
                LastName = "Smith",
                Role = UserRole.Student,
                CreatedAt = DateTime.Now
            };

            context.Users.AddRange(admin, instructor, student);
            context.SaveChanges();

            // Seed course
            var course = new Course
            {
                Title = "Introduction to ASP.NET Core",
                Description = "Learn the fundamentals of ASP.NET Core development including Web APIs, Entity Framework Core, and integration with React.",
                InstructorId = instructor.Id,
                CreatedAt = DateTime.Now
            };

            context.Courses.Add(course);
            context.SaveChanges();

            // Seed modules
            var module1 = new Module
            {
                Title = "Getting Started with ASP.NET Core",
                CourseId = course.Id,
                OrderIndex = 1
            };

            var module2 = new Module
            {
                Title = "Building Web APIs",
                CourseId = course.Id,
                OrderIndex = 2
            };

            context.Modules.AddRange(module1, module2);
            context.SaveChanges();

            // Seed lessons
            var lessons = new List<Lesson>
            {
                new Lesson
                {
                    Title = "Introduction to ASP.NET Core",
                    Content = "ASP.NET Core is a cross-platform, high-performance, open-source framework for building modern, cloud-based, Internet-connected applications.",
                    ModuleId = module1.Id,
                    OrderIndex = 1,
                    Type = LessonType.Text
                },
                new Lesson
                {
                    Title = "Setting Up Your Development Environment",
                    Content = "In this lesson, we'll set up Visual Studio and install the necessary tools for ASP.NET Core development.",
                    ModuleId = module1.Id,
                    OrderIndex = 2,
                    Type = LessonType.Text
                },
                new Lesson
                {
                    Title = "Creating Your First Web API",
                    Content = "Learn how to create a basic Web API using ASP.NET Core controllers and actions.",
                    ModuleId = module2.Id,
                    OrderIndex = 1,
                    Type = LessonType.Text
                },
                new Lesson
                {
                    Title = "Working with Entity Framework Core",
                    Content = "Understand how to use Entity Framework Core for database operations in your Web API.",
                    ModuleId = module2.Id,
                    OrderIndex = 2,
                    Type = LessonType.Text
                }
            };

            context.Lessons.AddRange(lessons);
            context.SaveChanges();

            // Seed enrollment
            var enrollment = new Enrollment
            {
                UserId = student.Id,
                CourseId = course.Id,
                EnrollmentDate = DateTime.Now,
                Status = EnrollmentStatus.Active
            };

            context.Enrollments.Add(enrollment);
            context.SaveChanges();
        }

        private static string HashPassword(string password)
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
