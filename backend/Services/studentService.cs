using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Models;
using demo_dotnet.backend.Repositories.Interface;
using demo_dotnet.backend.Services.Interface;

namespace demo_dotnet.backend.Services;

public class StudentService : IStudentService
{
    private readonly IStudentRepository _studentRepository;
    private readonly IParentRepository _parentRepository;
    private readonly IStudentParentRepository _studentParentRepository;

    public StudentService(
        IStudentRepository studentRepository,
        IParentRepository parentRepository,
        IStudentParentRepository studentParentRepository)
    {
        _studentRepository = studentRepository;
        _parentRepository = parentRepository;
        _studentParentRepository = studentParentRepository;
    }

    public async Task<List<StudentResponseDto>> GetStudentsAsync(int page, int pageSize, string? search, string? className)
    {
        var students = await _studentRepository.GetAllStudent();

        if (!string.IsNullOrWhiteSpace(search))
        {
            students = students.Where(s => s.FullName.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(className))
        {
            students = students.Where(s => s.ClassName == className).ToList();
        }

        return students.Select(MapToResponseDto).ToList();
    }

    public async Task<StudentDetailResponseDto> GetStudentByIdAsync(int id)
    {
        var student = await _studentRepository.GetByIdWithParentsAsync(id);   // dùng bản load kèm Parent
        if (student == null)
        {
            throw new NotFoundException($"Khong tim thay student co id {id}");
        }

        return MapToDetailDto(student);
    }

    public async Task<StudentDetailResponseDto> CreateStudentAsync(StudentRequest request)
    {
        // 1. Kiểm tra mã học sinh trùng lặp
        var existingStudent = await _studentRepository.GetByMhsAsync(request.Mhs);
        if (existingStudent != null)
        {
            throw new Exception($"Mã học sinh '{request.Mhs}' đã tồn tại");
        }

        // 2. TÌM VÀ KIỂM TRA PHỤ HUYNH TRƯỚC (Validate trước khi ghi bất kỳ dữ liệu nào vào DB)
        var parentsList = new List<ParentRelatedDto>();
        var parentEntities = new List<(Parent Parent, string RelationshipType)>();

        if (request.Parents != null && request.Parents.Any())
        {
            foreach (var parentRequest in request.Parents)
            {
                var parent = await _parentRepository.GetByIdAsync(parentRequest.ParentId);
                if (parent == null)
                {
                    // Nếu không thấy 1 phụ huynh bất kỳ -> Ném lỗi NGAY TẠI ĐÂY. 
                    // DB hoàn toàn chưa bị ghi học sinh mới!
                    throw new NotFoundException($"Không tìm thấy phụ huynh với Id = {parentRequest.ParentId}");
                }

                parentEntities.Add((parent, parentRequest.RelationshipType));
            }
        }

        // 3. Khởi tạo đối tượng Student
        var student = new Student
        {
            Mhs = request.Mhs,
            FullName = request.FullName,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            ClassName = request.ClassName,
            Address = request.Address
        };

        // 4. Lưu Student xuống DB để lấy student.Id
        await _studentRepository.AddAsync(student);
        await _studentRepository.SaveChangesAsync();

        // 5. Sau khi Student đã chắc chắn thành công -> Lưu liên kết phụ huynh
        foreach (var (parent, relationshipType) in parentEntities)
        {
            var studentParent = new StudentParent
            {
                StudentId = student.Id,
                ParentId = parent.Id,
                RelationshipType = relationshipType
            };

            await _studentParentRepository.AddAsync(studentParent);

            parentsList.Add(new ParentRelatedDto
            {
                Id = parent.Id,
                FullName = parent.FullName,
                PhoneNumber = parent.PhoneNumber,
                RelationshipType = relationshipType
            });
        }

        if (parentEntities.Any())
        {
            await _studentParentRepository.SaveChangesAsync();
        }

        // 6. Trả về DTO chi tiết
        return new StudentDetailResponseDto
        {
            Id = student.Id,
            Mhs = student.Mhs,
            FullName = student.FullName,
            DateOfBirth = student.DateOfBirth,
            Gender = student.Gender,
            ClassName = student.ClassName,
            Address = student.Address,
            Parents = parentsList
        };
    }

    public async Task<StudentResponseDto> UpdateStudentAsync(int id, StudentRequest request)
    {
        var student = await _studentRepository.GetByIdAsync(id);
        if (student == null)
        {
            throw new NotFoundException($"Khong tim thay student co id {id}");
        }

        // Validate Mhs trùng, loại trừ chính student đang update
        if (!string.IsNullOrWhiteSpace(request.Mhs) && request.Mhs != student.Mhs)
        {
            var existingStudent = await _studentRepository.GetByMhsAsync(request.Mhs);
            if (existingStudent != null)
            {
                throw new Exception($"Ma hoc sinh '{request.Mhs}' da ton tai");
            }
        }

        student.Mhs = request.Mhs;
        student.FullName = request.FullName;
        student.DateOfBirth = request.DateOfBirth;
        student.Gender = request.Gender;
        student.ClassName = request.ClassName;
        student.Address = request.Address;

        _studentRepository.Update(student);
        await _studentRepository.SaveChangesAsync();

        return MapToResponseDto(student);
    }

    public async Task DeleteStudentAsync(int id)
    {
        var student = await _studentRepository.GetByIdAsync(id);
        if (student == null)
        {
            throw new NotFoundException($"Khong tim thay student co id {id}");
        }

        _studentRepository.Delete(student);
        await _studentRepository.SaveChangesAsync();
    }

    public async Task AddParentToStudentAsync(int studentId, AddParentToStudentRequest request)
    {
        var student = await _studentRepository.GetByIdAsync(studentId);
        if (student == null)
        {
            throw new NotFoundException($"Khong tim thay student co id {studentId}");
        }

        var alreadyLinked = await _studentRepository.HasParentRelationAsync(studentId, request.ParentId);
        if (alreadyLinked)
        {
            throw new Exception("Parent nay da duoc lien ket voi student roi");
        }

        var relation = new StudentParent
        {
            StudentId = studentId,
            ParentId = request.ParentId
            // TODO: nếu StudentParent có thêm field (VD: Relationship = "Bố"/"Mẹ") thì map thêm
        };

        await _studentRepository.AddParentRelationAsync(relation);
        await _studentRepository.SaveChangesAsync();
    }

    public async Task RemoveParentFromStudentAsync(int studentId, int parentId)
    {
        var student = await _studentRepository.GetByIdAsync(studentId);
        if (student == null)
        {
            throw new NotFoundException($"Khong tim thay student co id {studentId}");
        }

        var isLinked = await _studentRepository.HasParentRelationAsync(studentId, parentId);
        if (!isLinked)
        {
            throw new NotFoundException("Khong tim thay lien ket giua student va parent nay");
        }

        await _studentRepository.RemoveParentRelationAsync(studentId, parentId);
        await _studentRepository.SaveChangesAsync();
    }

    private static StudentResponseDto MapToResponseDto(Student student)
    {
        return new StudentResponseDto
        {
            Id = student.Id,
            FullName = student.FullName,
            ClassName = student.ClassName
        };
    }

    private static StudentDetailResponseDto MapToDetailDto(Student student)
    {
        return new StudentDetailResponseDto
        {
            Id = student.Id,
            FullName = student.FullName,
            ClassName = student.ClassName
            // TODO: map thêm Parents = student.StudentParents.Select(...) nếu StudentDetailResponseDto có field Parents
        };
    }
}