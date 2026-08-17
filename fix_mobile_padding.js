const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach(dirent => {
    const filePath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      processDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add p-4 to Cards that start with a div that is flex and between
      content = content.replace(/<Card>\s*<div className="flex items-center justify-between">/g, '<Card className="p-4">\n          <div className="flex items-center justify-between">');

      fs.writeFileSync(filePath, content);
    }
  });
}

processDir('/Users/vivan/Desktop/PROTOTYPE/mobile/src/pages');
processDir('/Users/vivan/Desktop/PROTOTYPE/mobile/src/components');
console.log("Fixed mobile Card paddings.");
