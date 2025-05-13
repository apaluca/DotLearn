namespace DotLearn.Server.DTOs.Auth
{
    public class AuthResultDto
    {
        public string Token { get; set; }
        public UserDto User { get; set; }
    }
}
