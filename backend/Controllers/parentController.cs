using demo_dotnet.backend.DTOs.Request;
using demo_dotnet.backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace demo_dotnet.backend.Controllers;

[ApiController]
[Route("api/v1/parent/[controller]")]
[Authorize]
public class ParentController : ControllerBase
{
    private readonly IParentService _parentService;
    public ParentController(IParentService parentService)
    {
        _parentService = parentService;
    }

    // GET api/v1/parent?search=xxx
    [HttpGet]
    public async Task<IActionResult> GetAllOrSearch([FromQuery] string? search)
    {
        var result = await _parentService.getAllParentOrSearchByPhone(search);
        return Ok(result);
    }

    // GET api/v1/parent/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _parentService.GetParentByIdAsync(id);
        return Ok(result);
    }

    // POST api/v1/parent
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ParentRequest request)
    {
        var result = await _parentService.CreateParentAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // PUT api/v1/parent/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ParentRequest request)
    {
        var result = await _parentService.UpdateParentByIdAsync(id, request);
        return Ok(result);
    }

    // DELETE api/v1/parent/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var message = await _parentService.DeleteParentByIdAsync(id);
        return Ok(new { message });
    }

}