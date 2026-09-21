const fs = require('fs');

// Fix auth.service.ts
let authService = fs.readFileSync('src/app/core/auth/auth.service.ts', 'utf8');
authService = authService.replace(/return this\.http\.post.*?;/g, (match) => {
    if (match.includes('login')) return 'return this.http.post<LoginResponse>(${this.BASE_URL}/login, credentials);';
    if (match.includes('forgot-password')) return 'return this.http.post(${this.BASE_URL}/forgot-password, { email });';
    if (match.includes('reset-password')) return 'return this.http.post(${this.BASE_URL}/reset-password, { token, newPassword });';
    return match;
});
fs.writeFileSync('src/app/core/auth/auth.service.ts', authService);

// Fix login.component.ts
let login = fs.readFileSync('src/app/features/auth/login.component.ts', 'utf8');
login = login.replace(/    <\/div>\s*\\s*\}\)/g, '    </div>\n  \\n})');
// Fix the interpolation that might be broken
login = login.replace(/<span class="text-red-500">\*/g, '<span class="text-red-500">*');
fs.writeFileSync('src/app/features/auth/login.component.ts', login);

// Fix reset-password.component.ts
let reset = fs.readFileSync('src/app/features/auth/reset-password.component.ts', 'utf8');
reset = reset.replace(/    <\/style>\s*\\s*\}\)/g, '    </style>\n  \\n})');
fs.writeFileSync('src/app/features/auth/reset-password.component.ts', reset);
