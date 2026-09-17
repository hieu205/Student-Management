using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Services.Interface;

namespace demo_dotnet.backend.Services;

public class ParentService : IParentService
{
    private readonly IParentRepository _parentRepository;

    public ParentService(IParentRepository parentRepository)
    {
        _parentRepository = parentRepository;
    }

    public async Task<List<ParentResponseDto>> getAllParentOrSearchByPhone(string? search)
    {
        var items = await _parentRepository.GetAllAsync(search);

        // Cú pháp LINQ chuẩn: p đại diện cho từng item Parent trong danh sách
        return items.Select(p => MapToResponseDto(p)).ToList();
    }

    public async Task<ParentResponseDto> GetParentByIdAsync(int id)
    {
        var items = await _parentRepository.GetByIdAsync(id);
        if (items == null)
        {
            throw new NotFoundException($"Khong tim thay parent co id {id}");
        }
        return MapToResponseDto(items);
    }

    public async Task<ParentResponseDto> CreateParentAsync(ParentRequest parentRequest)
    {
        if (parentRequest == null)
        {
            throw new BadRequestException("Dữ liệu đầu vào không hợp lệ");
        }

        var checkParent = await _parentRepository.GetByPhoneNumberAsync(parentRequest.PhoneNumber);
        if (checkParent != null)
        {
            throw new ConflictException("Phụ huynh với số điện thoại này đã tồn tại");
        }
        if (!string.IsNullOrWhiteSpace(parentRequest.Email))
        {
            var checkMailParent = await _parentRepository.GetByEmailAsync(parentRequest.Email);
            if (checkMailParent != null)
            {
                throw new ConflictException("Phụ huynh với email này đã tồn tại");
            }
        }
        var parent = new Parent
        {
            FullName = parentRequest.FullName,
            PhoneNumber = parentRequest.PhoneNumber,
            Email = parentRequest.Email,
            Address = parentRequest.Address,
            Occupation = parentRequest.Occupation
        };
        await _parentRepository.AddAsync(parent);
        await _parentRepository.SaveChangesAsync();
        return MapToResponseDto(parent);
    }

    public async Task<ParentResponseDto> UpdateParentByIdAsync(int id, ParentRequest parentRequest)
    {
        var items = await _parentRepository.GetByIdAsync(id);
        if (items == null)
        {
            throw new NotFoundException($"Khong tim thay parent co id {id}");
        }
        var checkPhoneParent = await _parentRepository.GetByPhoneNumberAsync(parentRequest.PhoneNumber);
        if (checkPhoneParent != null && checkPhoneParent.Id != id)
        {
            throw new ConflictException("Số điện thoại này đã được đăng ký");
        }
        if (!string.IsNullOrWhiteSpace(parentRequest.Email))
        {
            var checkMailParent = await _parentRepository.GetByEmailAsync(parentRequest.Email);
            if (checkMailParent != null && checkMailParent.Id != id)
            {
                throw new ConflictException("Phụ huynh với email này đã tồn tại");
            }
        }

        items.Email = parentRequest.Email;
        items.PhoneNumber = parentRequest.PhoneNumber;
        items.Occupation = parentRequest.Occupation;
        items.Address = parentRequest.Address;
        items.FullName = parentRequest.FullName;

        _parentRepository.Update(items);
        await _parentRepository.SaveChangesAsync();

        return MapToResponseDto(items);
    }

    public async Task<string> DeleteParentByIdAsync(int id)
    {
        var items = await _parentRepository.GetByIdAsync(id);
        if (items == null)
        {
            throw new NotFoundException($"Khong tim thay parent co id {id}");
        }
        _parentRepository.Delete(items);
        await _parentRepository.SaveChangesAsync();
        return $"Xoa parent co id {id} thanh cong";
    }
    private static ParentResponseDto MapToResponseDto(Parent parent)
    {
        return new ParentResponseDto
        {
            Id = parent.Id,
            FullName = parent.FullName,
            PhoneNumber = parent.PhoneNumber,
            Email = parent.Email,
            Address = parent.Address,
            Occupation = parent.Occupation
        };
    }
}