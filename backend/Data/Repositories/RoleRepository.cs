using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace demo_dotnet.backend.Data.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly AppDbContext _context;

    public RoleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeRoleId = null)
    {
        var query = _context.Roles.AsQueryable();

        if (excludeRoleId.HasValue)
        {
            query = query.Where(r => r.Id != excludeRoleId.Value);
        }

        // So sánh không phân biệt hoa thường ở phía DB (EF → PostgreSQL ILIKE)
        return await query.AnyAsync(r => r.Name.ToLower() == name.ToLower());
    }

    public async Task<List<int>> GetExistingPermissionIdsAsync(List<int> permissionIds)
    {
        return await _context.Permissions
            .Where(p => permissionIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();
    }

    public async Task<Role> CreateRoleAsync(Role role, List<int> permissionIds)
    {
        // Dùng transaction để đảm bảo Role và RolePermissions được tạo cùng nhau
        // Nếu bước nào thất bại, toàn bộ rollback → không có dữ liệu không nhất quán
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            _context.Roles.Add(role);
            await _context.SaveChangesAsync(); // role.Id được sinh ra ở đây

            var rolePermissions = permissionIds.Select(pid => new RolePermission
            {
                RoleId = role.Id,
                PermissionId = pid
            }).ToList();

            _context.RolePermissions.AddRange(rolePermissions);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return (await GetRoleByIdAsync(role.Id))!;
    }

    public async Task<List<Role>> GetAllRolesAsync()
    {
        return await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .OrderBy(r => r.Name)
            .ToListAsync();
    }

    public async Task<Role?> GetRoleByIdAsync(int id)
    {
        return await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Role> UpdateRoleAsync(Role role, List<int> permissionIds)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            _context.Roles.Update(role);

            // Xóa toàn bộ RolePermission cũ của role này
            var existing = await _context.RolePermissions
                .Where(rp => rp.RoleId == role.Id)
                .ToListAsync();
            _context.RolePermissions.RemoveRange(existing);

            // Thêm lại danh sách RolePermission mới
            var newRolePermissions = permissionIds.Select(pid => new RolePermission
            {
                RoleId = role.Id,
                PermissionId = pid
            }).ToList();
            _context.RolePermissions.AddRange(newRolePermissions);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return (await GetRoleByIdAsync(role.Id))!;
    }

    public async Task DeleteRoleAsync(int id)
    {
        // Service đã kiểm tra tồn tại trước khi gọi, nên chỉ cần tìm và xoá
        var role = await _context.Roles.FindAsync(id);
        if (role == null) return;

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();
        // RolePermissions liên quan sẽ tự xoá theo Cascade Delete đã cấu hình trong DB
    }
}