const fs=require('fs');
const p='e:/demo/frontend/src/app/features/auth/login.component.ts';
let c=fs.readFileSync(p,'utf8');

c = c.replace(/class="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-3 pr-10 text-gray-700 dark:text-slate-300/g, 'class="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-3 pr-10 bg-white dark:bg-slate-700 text-gray-700 dark:text-white');

c = c.replace(/class="shadow-sm appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-slate-300/g, 'class="shadow-sm appearance-none border rounded-lg w-full py-2.5 px-3 bg-white dark:bg-slate-700 text-gray-700 dark:text-white');

fs.writeFileSync(p, c);

