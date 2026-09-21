const fs = require('fs');
for (const file of ['src/app/features/auth/login.component.ts', 'src/app/features/auth/reset-password.component.ts']) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/template: \\\r?\n/g, 'template: \\n');
    content = content.replace(/    <\/style>\s*\\\r?\n\s*\}/g, '    </style>\n  \\n}');
    content = content.replace(/    <\/div>\s*\\\r?\n\s*\}/g, '    </div>\n  \\n}');
    fs.writeFileSync(file, content);
}
