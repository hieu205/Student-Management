using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace demo_dotnet.backend.Security;

// BẮT BUỘC phải có `: IAuthorizationPolicyProvider` ở đây
public class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    public DefaultAuthorizationPolicyProvider FallbackPolicyProvider { get; }

    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        FallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith("PERMISSION:", StringComparison.OrdinalIgnoreCase))
        {
            var code = policyName.Substring("PERMISSION:".Length);
            var policy = new AuthorizationPolicyBuilder();
            policy.RequireClaim("permission", code);
            return Task.FromResult<AuthorizationPolicy?>(policy.Build());
        }

        return FallbackPolicyProvider.GetPolicyAsync(policyName);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => FallbackPolicyProvider.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => FallbackPolicyProvider.GetFallbackPolicyAsync();
}