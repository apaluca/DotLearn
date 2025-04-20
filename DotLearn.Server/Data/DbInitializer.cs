using DotLearn.Server.Models;
using DotLearn.Server.Models.DotLearn.Server.Models;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace DotLearn.Server.Data
{
    /// <summary>
    /// Provides methods to initialize the database with seed data
    /// </summary>
    public static class DbInitializer
    {
        /// <summary>
        /// Initializes the database by applying migrations and seeding initial data if needed
        /// </summary>
        /// <param name="context">The database context to initialize</param>
        public static void Initialize(LmsDbContext context)
        {
            // Make sure the database is created and all pending migrations are applied
            context.Database.Migrate();

            // Seed in the correct order to maintain relationships
            if (!context.Users.Any())
            {
                SeedUsers(context);
            }

            if (!context.Courses.Any())
            {
                SeedCourses(context);
            }

            if (!context.Modules.Any())
            {
                SeedModules(context);
            }

            if (!context.Lessons.Any())
            {
                SeedLessons(context);
                SeedQuizzes(context);
            }

            if (!context.Enrollments.Any())
            {
                SeedEnrollments(context);
                SeedProgress(context);
            }
        }

        /// <summary>
        /// Seeds initial users with different roles
        /// </summary>
        private static void SeedUsers(LmsDbContext context)
        {
            var users = new List<User>
            {
                new User
                {
                    Username = "admin",
                    Email = "admin@dotlearn.com",
                    PasswordHash = HashPassword("Admin123!"),
                    FirstName = "Admin",
                    LastName = "User",
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Username = "instructor",
                    Email = "instructor@dotlearn.com",
                    PasswordHash = HashPassword("Instructor123!"),
                    FirstName = "John",
                    LastName = "Doe",
                    Role = UserRole.Instructor,
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Username = "student",
                    Email = "student@dotlearn.com",
                    PasswordHash = HashPassword("Student123!"),
                    FirstName = "Jane",
                    LastName = "Smith",
                    Role = UserRole.Student,
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Username = "instructor2",
                    Email = "instructor2@dotlearn.com",
                    PasswordHash = HashPassword("Instructor123!"),
                    FirstName = "Robert",
                    LastName = "Johnson",
                    Role = UserRole.Instructor,
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Username = "student2",
                    Email = "student2@dotlearn.com",
                    PasswordHash = HashPassword("Student123!"),
                    FirstName = "Emily",
                    LastName = "Davis",
                    Role = UserRole.Student,
                    CreatedAt = DateTime.Now
                }
            };

            context.Users.AddRange(users);
            context.SaveChanges();
        }

        /// <summary>
        /// Seeds initial courses
        /// </summary>
        private static void SeedCourses(LmsDbContext context)
        {
            var instructorId = context.Users.FirstOrDefault(u => u.Username == "instructor")?.Id ?? 1;
            var instructor2Id = context.Users.FirstOrDefault(u => u.Username == "instructor2")?.Id ?? 1;

            var courses = new List<Course>
            {
                new Course
                {
                    Title = "Introduction to ASP.NET Core",
                    Description = "Learn the fundamentals of ASP.NET Core development including Web APIs, Entity Framework Core, and integration with React.",
                    InstructorId = instructorId,
                    CreatedAt = DateTime.Now.AddDays(-30)
                },
                new Course
                {
                    Title = "Advanced React Development",
                    Description = "Master advanced React concepts including hooks, context, and Redux for state management in large-scale applications.",
                    InstructorId = instructorId,
                    CreatedAt = DateTime.Now.AddDays(-20)
                },
                new Course
                {
                    Title = "SQL Server for Developers",
                    Description = "Comprehensive guide to SQL Server for application developers, covering database design, optimization, and integration.",
                    InstructorId = instructor2Id,
                    CreatedAt = DateTime.Now.AddDays(-15)
                }
            };

            context.Courses.AddRange(courses);
            context.SaveChanges();
        }

        /// <summary>
        /// Seeds initial modules for courses
        /// </summary>
        private static void SeedModules(LmsDbContext context)
        {
            var course1Id = context.Courses.FirstOrDefault(c => c.Title == "Introduction to ASP.NET Core")?.Id ?? 1;
            var course2Id = context.Courses.FirstOrDefault(c => c.Title == "Advanced React Development")?.Id ?? 2;
            var course3Id = context.Courses.FirstOrDefault(c => c.Title == "SQL Server for Developers")?.Id ?? 3;

            var modules = new List<Module>
            {
                // ASP.NET Course Modules
                new Module
                {
                    Title = "Getting Started with ASP.NET Core",
                    CourseId = course1Id,
                    OrderIndex = 1
                },
                new Module
                {
                    Title = "Building Web APIs",
                    CourseId = course1Id,
                    OrderIndex = 2
                },
                new Module
                {
                    Title = "Entity Framework Core",
                    CourseId = course1Id,
                    OrderIndex = 3
                },
                
                // React Course Modules
                new Module
                {
                    Title = "React Fundamentals Review",
                    CourseId = course2Id,
                    OrderIndex = 1
                },
                new Module
                {
                    Title = "Advanced Hooks and State Management",
                    CourseId = course2Id,
                    OrderIndex = 2
                },
                
                // SQL Server Course Modules
                new Module
                {
                    Title = "Database Design Principles",
                    CourseId = course3Id,
                    OrderIndex = 1
                },
                new Module
                {
                    Title = "Query Optimization",
                    CourseId = course3Id,
                    OrderIndex = 2
                }
            };

            context.Modules.AddRange(modules);
            context.SaveChanges();
        }

        /// <summary>
        /// Seeds initial lessons for modules
        /// </summary>
        private static void SeedLessons(LmsDbContext context)
        {
            // Get module IDs
            var moduleIds = context.Modules.ToDictionary(m => m.Title, m => m.Id);

            var lessons = new List<Lesson>();

            // ASP.NET Core - Getting Started Module
            if (moduleIds.TryGetValue("Getting Started with ASP.NET Core", out int moduleId1))
            {
                lessons.AddRange(new List<Lesson>
                {
                    new Lesson
                    {
                        Title = "Introduction to ASP.NET Core",
                        Content = "<h2>Welcome to ASP.NET Core</h2><p>ASP.NET Core is a cross-platform, high-performance, open-source framework for building modern, cloud-based, Internet-connected applications.</p><p>In this course, we'll explore the fundamentals of ASP.NET Core and learn how to build robust web applications.</p>",
                        ModuleId = moduleId1,
                        OrderIndex = 1,
                        Type = LessonType.Text
                    },
                    new Lesson
                    {
                        Title = "Setting Up Your Development Environment",
                        Content = "<h2>Setting Up Your Development Environment</h2><p>In this lesson, we'll set up Visual Studio and install the necessary tools for ASP.NET Core development.</p><ul><li>Installing Visual Studio</li><li>Installing .NET SDK</li><li>Setting up a new ASP.NET Core project</li></ul>",
                        ModuleId = moduleId1,
                        OrderIndex = 2,
                        Type = LessonType.Text
                    },
                    new Lesson
                    {
                        Title = "ASP.NET Core Architecture",
                        Content = "https://www.youtube.com/watch?v=exampleVideo1",
                        ModuleId = moduleId1,
                        OrderIndex = 3,
                        Type = LessonType.Video
                    },
                    new Lesson
                    {
                        Title = "First Module Quiz",
                        Content = "Quiz questions about ASP.NET Core fundamentals",
                        ModuleId = moduleId1,
                        OrderIndex = 4,
                        Type = LessonType.Quiz
                    }
                });
            }

            // ASP.NET Core - Building Web APIs Module
            if (moduleIds.TryGetValue("Building Web APIs", out int moduleId2))
            {
                lessons.AddRange(new List<Lesson>
                {
                    new Lesson
                    {
                        Title = "Creating Your First Web API",
                        Content = "<h2>Creating Your First Web API</h2><p>Learn how to create a basic Web API using ASP.NET Core controllers and actions.</p><p>We'll implement GET, POST, PUT, and DELETE endpoints to perform CRUD operations on a resource.</p>",
                        ModuleId = moduleId2,
                        OrderIndex = 1,
                        Type = LessonType.Text
                    },
                    new Lesson
                    {
                        Title = "Working with Entity Framework Core",
                        Content = "<h2>Working with Entity Framework Core</h2><p>Understand how to use Entity Framework Core for database operations in your Web API.</p><p>We'll cover:</p><ul><li>DbContext configuration</li><li>Entity modeling</li><li>Migrations</li><li>CRUD operations using EF Core</li></ul>",
                        ModuleId = moduleId2,
                        OrderIndex = 2,
                        Type = LessonType.Text
                    }
                });
            }

            // React - Advanced Hooks Module
            if (moduleIds.TryGetValue("Advanced Hooks and State Management", out int moduleId5))
            {
                lessons.AddRange(new List<Lesson>
                {
                    new Lesson
                    {
                        Title = "Understanding useReducer",
                        Content = "<h2>Understanding useReducer</h2><p>The useReducer hook is an alternative to useState for complex state logic. It's particularly useful when the next state depends on the previous state or when you have multiple sub-values.</p>",
                        ModuleId = moduleId5,
                        OrderIndex = 1,
                        Type = LessonType.Text
                    },
                    new Lesson
                    {
                        Title = "Building Custom Hooks",
                        Content = "<h2>Building Custom Hooks</h2><p>Custom hooks allow you to extract component logic into reusable functions. They are a powerful pattern to share stateful logic between components without changing their structure.</p>",
                        ModuleId = moduleId5,
                        OrderIndex = 2,
                        Type = LessonType.Text
                    },
                    new Lesson
                    {
                        Title = "State Management with Context API",
                        Content = "https://www.youtube.com/watch?v=exampleVideo2",
                        ModuleId = moduleId5,
                        OrderIndex = 3,
                        Type = LessonType.Video
                    }
                });
            }

            // Add more lessons for other modules as needed
            if (lessons.Any())
            {
                context.Lessons.AddRange(lessons);
                context.SaveChanges();
            }
        }

        /// <summary>
        /// Seeds quiz questions and options for quiz lessons
        /// </summary>
        private static void SeedQuizzes(LmsDbContext context)
        {
            // Find the quiz lesson
            var quizLesson = context.Lessons.FirstOrDefault(l => l.Type == LessonType.Quiz);
            if (quizLesson == null) return;

            // Create quiz questions
            var questions = new List<QuizQuestion>
            {
                new QuizQuestion
                {
                    LessonId = quizLesson.Id,
                    QuestionText = "Which of the following is a key feature of ASP.NET Core?",
                    OrderIndex = 1,
                    Options = new List<QuizOption>
                    {
                        new QuizOption { OptionText = "Cross-platform support", IsCorrect = true },
                        new QuizOption { OptionText = "Windows-only development", IsCorrect = false },
                        new QuizOption { OptionText = "Requires IIS to run", IsCorrect = false },
                        new QuizOption { OptionText = "Only supports MVC pattern", IsCorrect = false }
                    }
                },
                new QuizQuestion
                {
                    LessonId = quizLesson.Id,
                    QuestionText = "What command is used to create a new ASP.NET Core project from the command line?",
                    OrderIndex = 2,
                    Options = new List<QuizOption>
                    {
                        new QuizOption { OptionText = "dotnet new", IsCorrect = true },
                        new QuizOption { OptionText = "asp create", IsCorrect = false },
                        new QuizOption { OptionText = "nuget install", IsCorrect = false },
                        new QuizOption { OptionText = "msbuild start", IsCorrect = false }
                    }
                },
                new QuizQuestion
                {
                    LessonId = quizLesson.Id,
                    QuestionText = "Which file contains the configuration settings for an ASP.NET Core application?",
                    OrderIndex = 3,
                    Options = new List<QuizOption>
                    {
                        new QuizOption { OptionText = "appsettings.json", IsCorrect = true },
                        new QuizOption { OptionText = "web.config", IsCorrect = false },
                        new QuizOption { OptionText = "config.xml", IsCorrect = false },
                        new QuizOption { OptionText = "settings.ini", IsCorrect = false }
                    }
                }
            };

            context.QuizQuestions.AddRange(questions);
            context.SaveChanges();
        }

        /// <summary>
        /// Seeds initial enrollments
        /// </summary>
        private static void SeedEnrollments(LmsDbContext context)
        {
            var studentId = context.Users.FirstOrDefault(u => u.Username == "student")?.Id ?? 3;
            var student2Id = context.Users.FirstOrDefault(u => u.Username == "student2")?.Id ?? 5;

            var courses = context.Courses.ToList();

            var enrollments = new List<Enrollment>();

            // Enroll first student in all courses
            foreach (var course in courses)
            {
                enrollments.Add(new Enrollment
                {
                    UserId = studentId,
                    CourseId = course.Id,
                    EnrollmentDate = DateTime.Now.AddDays(-15),
                    Status = EnrollmentStatus.Active
                });
            }

            // Enroll second student in first course
            if (courses.Any())
            {
                enrollments.Add(new Enrollment
                {
                    UserId = student2Id,
                    CourseId = courses.First().Id,
                    EnrollmentDate = DateTime.Now.AddDays(-10),
                    Status = EnrollmentStatus.Active
                });
            }

            context.Enrollments.AddRange(enrollments);
            context.SaveChanges();
        }

        /// <summary>
        /// Seeds initial lesson progress
        /// </summary>
        private static void SeedProgress(LmsDbContext context)
        {
            var studentId = context.Users.FirstOrDefault(u => u.Username == "student")?.Id ?? 3;

            // Get first course lessons
            var firstCourseId = context.Courses.FirstOrDefault()?.Id ?? 1;
            var lessons = context.Lessons
                .Where(l => l.Module.CourseId == firstCourseId)
                .OrderBy(l => l.Module.OrderIndex)
                .ThenBy(l => l.OrderIndex)
                .ToList();

            if (!lessons.Any()) return;

            var progress = new List<LessonProgress>();

            // Mark first two lessons as completed
            for (int i = 0; i < Math.Min(lessons.Count, 2); i++)
            {
                progress.Add(new LessonProgress
                {
                    UserId = studentId,
                    LessonId = lessons[i].Id,
                    StartedAt = DateTime.Now.AddDays(-7),
                    CompletedAt = DateTime.Now.AddDays(-6),
                    IsCompleted = true
                });
            }

            // Mark next lesson as in progress
            if (lessons.Count > 2)
            {
                progress.Add(new LessonProgress
                {
                    UserId = studentId,
                    LessonId = lessons[2].Id,
                    StartedAt = DateTime.Now.AddDays(-2),
                    IsCompleted = false
                });
            }

            context.LessonProgress.AddRange(progress);
            context.SaveChanges();
        }

        /// <summary>
        /// Hashes a password using PBKDF2 with a random salt
        /// </summary>
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