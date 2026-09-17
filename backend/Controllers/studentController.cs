using Microsoft.AspNetCore.Mvc;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using demo_dotnet.backend.Attributes;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class StudentController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    [HttpGet]
    [HasPermission("student:read")]
    public async Task<ActionResult<List<StudentResponseDto>>> GetStudents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? className = null,
        [FromQuery] string? mhs = null)
    {
        var students = await _studentService.GetStudentsAsync(page, pageSize, search, className, mhs);
        return Ok(students);
    }

    [HttpGet("{id}")]
    [HasPermission("student:read")]
    public async Task<ActionResult<StudentDetailResponseDto>> GetStudentById(int id)
    {
        var student = await _studentService.GetStudentByIdAsync(id);
        return Ok(student);
    }

    [HttpPost]
    [HasPermission("student:create")]
    public async Task<ActionResult<StudentResponseDto>> CreateStudent([FromBody] StudentRequest request)
    {
        var student = await _studentService.CreateStudentAsync(request);
        return CreatedAtAction(nameof(GetStudentById), new { id = student.Id }, student);
    }

    [HttpPut("{id}")]
    [HasPermission("student:update")]
    public async Task<ActionResult<StudentResponseDto>> UpdateStudent(int id, [FromBody] StudentRequest request)
    {
        var student = await _studentService.UpdateStudentAsync(id, request);
        return Ok(student);
    }

    [HttpDelete("{id}")]
    [HasPermission("student:delete")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        await _studentService.DeleteStudentAsync(id);
        return NoContent();
    }

    [HttpPost("{studentId}/parents")]
    [HasPermission("student_parent:assign")]
    public async Task<IActionResult> AddParentToStudent(int studentId, [FromBody] AddParentToStudentRequest request)
    {
        await _studentService.AddParentToStudentAsync(studentId, request);
        return NoContent();
    }

    [HttpDelete("{studentId}/parents/{parentId}")]
    [HasPermission("student_parent:remove")]
    public async Task<IActionResult> RemoveParentFromStudent(int studentId, int parentId)
    {
        await _studentService.RemoveParentFromStudentAsync(studentId, parentId);
        return NoContent();
    }
}