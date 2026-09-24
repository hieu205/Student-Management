using backend.Models;
using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace demo_dotnet.backend.Data.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly AppDbContext _context;

    public ChatRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ChatRoom?> GetRoomBetweenAdminsAsync(int admin1Id, int admin2Id)
    {
        var minId = Math.Min(admin1Id, admin2Id);
        var maxId = Math.Max(admin1Id, admin2Id);

        return await _context.ChatRooms
            .FirstOrDefaultAsync(r => r.Admin1Id == minId && r.Admin2Id == maxId);
    }

    public async Task<ChatRoom> CreateRoomAsync(int admin1Id, int admin2Id)
    {
        var room = new ChatRoom
        {
            Admin1Id = Math.Min(admin1Id, admin2Id),
            Admin2Id = Math.Max(admin1Id, admin2Id),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();
        return room;
    }

    public async Task<List<ChatRoom>> GetRoomsByAdminIdAsync(int adminId)
    {
        return await _context.ChatRooms
            .Include(r => r.Admin1)
            .Include(r => r.Admin2)
            .Include(r => r.Messages)
            .Where(r => r.Admin1Id == adminId || r.Admin2Id == adminId)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();
    }

    public async Task<ChatMessage> SaveMessageAsync(ChatMessage message)
    {
        _context.ChatMessages.Add(message);

        var room = await _context.ChatRooms.FindAsync(message.RoomId);
        if (room != null)
        {
            room.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return message;
    }

    public async Task<List<ChatMessage>> GetMessagesByRoomIdAsync(long roomId, int page, int pageSize)
    {
        return await _context.ChatMessages
            .Where(m => m.RoomId == roomId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    // Đã đổi long -> int
    public async Task MarkMessagesAsReadAsync(long roomId, int currentAdminId)
    {
        var unreadMessages = await _context.ChatMessages
            .Where(m => m.RoomId == roomId && m.SenderId != currentAdminId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unreadMessages)
        {
            msg.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }
}