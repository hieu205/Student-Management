using Microsoft.AspNetCore.Mvc;
using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.DTOs.Response;
using demo_dotnet.backend.Services.Interface;
using demo_dotnet.backend.exception;
using Microsoft.AspNetCore.Authorization;

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

    // GET: api/student?page=1&pageSize=10&search=abc&className=10A1
    [HttpGet]
    public async Task<ActionResult<List<StudentResponseDto>>> GetStudents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? className = null, [FromQuery] string? mhs = null)
    {
        var students = await _studentService.GetStudentsAsync(page, pageSize, search, className, mhs);
        return Ok(students);
    }

    // GET: api/student/5
    [HttpGet("{id}")]
    public async Task<ActionResult<StudentDetailResponseDto>> GetStudentById(int id)
    {
        try
        {
            var student = await _studentService.GetStudentByIdAsync(id);
            return Ok(student);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // POST: api/student
    [HttpPost]
    public async Task<ActionResult<StudentResponseDto>> CreateStudent([FromBody] StudentRequest request)
    {
        try
        {
            var student = await _studentService.CreateStudentAsync(request);
            return CreatedAtAction(nameof(GetStudentById), new { id = student.Id }, student);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/student/5
    [HttpPut("{id}")]
    public async Task<ActionResult<StudentResponseDto>> UpdateStudent(int id, [FromBody] StudentRequest request)
    {
        try
        {
            var student = await _studentService.UpdateStudentAsync(id, request);
            return Ok(student);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE: api/student/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        try
        {
            await _studentService.DeleteStudentAsync(id);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // POST: api/student/5/parents
    [HttpPost("{studentId}/parents")]
    public async Task<IActionResult> AddParentToStudent(int studentId, [FromBody] AddParentToStudentRequest request)
    {
        try
        {
            await _studentService.AddParentToStudentAsync(studentId, request);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE: api/student/5/parents/3
    [HttpDelete("{studentId}/parents/{parentId}")]
    public async Task<IActionResult> RemoveParentFromStudent(int studentId, int parentId)
    {
        try
        {
            await _studentService.RemoveParentFromStudentAsync(studentId, parentId);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}