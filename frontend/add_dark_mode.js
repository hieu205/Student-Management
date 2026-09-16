const fs = require('fs');
const path = require('path');

const dir = 'e:/demo/frontend/src/app/features';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files that were already processed manually
  if (filePath.includes('main-layout.component.ts')) return;

  // Backgrounds
  content = content.replace(/bg-white/g, 'bg-white dark:bg-slate-800');
  content = content.replace(/bg-gray-50(\/50)?/g, 'bg-gray-50$1 dark:bg-slate-900');
  content = content.replace(/bg-gray-100/g, 'bg-gray-100 dark:bg-slate-700');

  // Text colors
  content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
  content = content.replace(/text-gray-800/g, 'text-gray-800 dark:text-slate-100');
  content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-slate-300');
  content = content.replace(/text-gray-600/g, 'text-gray-600 dark:text-slate-300');
  content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-slate-400');

  // Borders
  content = content.replace(/border-gray-100/g, 'border-gray-100 dark:border-slate-700');
  content = content.replace(/border-gray-200/g, 'border-gray-200 dark:border-slate-700');
  content = content.replace(/border-gray-300/g, 'border-gray-300 dark:border-slate-600');

  // Specific elements (inputs)
  content = content.replace(/bg-white placeholder-gray-500/g, 'bg-white dark:bg-slate-800 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white');

  // Hover effects
  content = content.replace(/hover:bg-gray-50/g, 'hover:bg-gray-50 dark:hover:bg-slate-700');
  content = content.replace(/hover:bg-blue-50(?!0)/g, 'hover:bg-blue-50 dark:hover:bg-slate-700');
  content = content.replace(/hover:bg-red-50(?!0)/g, 'hover:bg-red-50 dark:hover:bg-red-900/30');

  // Dividers
  content = content.replace(/divide-gray-100/g, 'divide-gray-100 dark:divide-slate-700');
  content = content.replace(/divide-gray-200/g, 'divide-gray-200 dark:divide-slate-700');

  // Blue elements
  content = content.replace(/bg-blue-50(?!0)/g, 'bg-blue-50 dark:bg-blue-900/20');
  content = content.replace(/text-blue-600/g, 'text-blue-600 dark:text-blue-400');

  // Fixes for forms and inputs
  content = content.replace(/class="([^"]*)focus:border-blue-500([^"]*)"/g, 'class="$1focus:border-blue-500 dark:focus:border-blue-400 dark:bg-slate-800 dark:text-white$2"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', filePath);
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.component.ts') || file.endsWith('.component.html')) {
      processFile(filePath);
    }
  });
}

walk(dir);
console.log('Done.');

