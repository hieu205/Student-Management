using demo_dotnet.backend.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace demo_dotnet.backend.Controllers;

public class ChatUploadLimitsFilter(IOptions<ChatAttachmentOptions> options) : IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var limit = options.Value.MaxRequestBytes;
        if (context.HttpContext.Request.ContentLength > limit)
        {
            context.Result = new ObjectResult(new { message = "Dung lượng yêu cầu vượt giới hạn.", errors = (object?)null })
                { StatusCode = StatusCodes.Status413PayloadTooLarge };
            return;
        }
        var feature = context.HttpContext.Features.Get<IHttpMaxRequestBodySizeFeature>();
        if (feature is { IsReadOnly: false }) feature.MaxRequestBodySize = limit;
        context.HttpContext.Features.Set<IFormFeature>(new FormFeature(context.HttpContext.Request, new FormOptions
        {
            MultipartBodyLengthLimit = limit, ValueCountLimit = 32, MultipartHeadersCountLimit = 16,
            MultipartHeadersLengthLimit = 16 * 1024
        }));
    }

    public void OnResourceExecuted(ResourceExecutedContext context) { }
}
