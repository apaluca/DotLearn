using DotLearn.Server.DTOs.Modules;

namespace DotLearn.Server.Services
{
    public interface IModuleService
    {
        Task<IEnumerable<ModuleDto>> GetModulesByCourseIdAsync(int courseId, int userId, string userRole);
        Task<ModuleDetailDto> GetModuleByIdAsync(int id, int userId, string userRole);
        Task<ModuleDto> CreateModuleAsync(CreateModuleDto moduleDto, int userId, string userRole);
        Task UpdateModuleAsync(int id, UpdateModuleDto moduleDto, int userId, string userRole);
        Task DeleteModuleAsync(int id, int userId, string userRole);
    }
}