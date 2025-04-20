namespace DotLearn.Server.DTOs.Admin
{
    public class UserListDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public int CoursesEnrolled { get; set; }
        public int CoursesCreated { get; set; }
    }
}
