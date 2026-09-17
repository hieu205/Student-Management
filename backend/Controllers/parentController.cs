using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using demo_dotnet.backend.Attributes;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ParentController : ControllerBase
{
    private readonly IParentService _parentService;

    public ParentController(IParentService parentService)
    {
        _parentService = parentService;
    }

    [HttpGet]
    [HasPermission("parent:read")]
    public async Task<IActionResult> GetAllOrSearch([FromQuery] string? search)
    {
        var result = await _parentService.getAllParentOrSearchByPhone(search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [HasPermission("parent:read")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _parentService.GetParentByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [HasPermission("parent:create")]
    public async Task<IActionResult> Create([FromBody] ParentRequest request)
    {
        var result = await _parentService.CreateParentAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [HasPermission("parent:update")]
    public async Task<IActionResult> Update(int id, [FromBody] ParentRequest request)
    {
        var result = await _parentService.UpdateParentByIdAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [HasPermission("parent:delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _parentService.DeleteParentByIdAsync(id);
        return NoContent();
    }
}