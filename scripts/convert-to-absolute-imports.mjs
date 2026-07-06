/**
 * Converts relative imports to absolute @/ imports in TypeScript files.
 */

import fs from 'fs';
import path from 'path';

const ROOT = '/home/ken/fidscript-whatsapp/server/src';

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const newContent = content.replace(/from\s+['"](\.\.\/[^'"]+)['"]/g, (match, relPath) => {
    // Extract upCount and modulePath correctly
    // ^(\.\.\/)+ matches ALL ../ sequences at the start
    const upMatch = relPath.match(/^(\.\.\/)+/);
    const upCount = upMatch ? upMatch[0].split('/').filter(Boolean).length : 0;
    const modulePath = relPath.slice(upCount * 3).replace(/\.js$/, '');  // each ../ is 3 chars
    
    // Get file's directory depth relative to ROOT
    const fileDir = path.dirname(filePath);
    const fileDirRel = path.relative(ROOT, fileDir);
    const fileDepth = fileDirRel ? fileDirRel.split(path.sep).filter(Boolean).length : 0;
    
    // Go up from file's directory to reach ROOT, then down to module
    const parts = [...fileDirRel.split(path.sep).filter(Boolean)];
    for (let i = 0; i < upCount; i++) {
      parts.pop();
    }
    parts.push(...modulePath.split('/'));
    
    const absImport = '@/' + parts.join('/');
    return 'from \'' + absImport + '\'';
  });
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log('Converted:', filePath);
    return true;
  }
  return false;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      convertFile(fullPath);
    }
  }
}

walkDir(ROOT);
console.log('Done!');
