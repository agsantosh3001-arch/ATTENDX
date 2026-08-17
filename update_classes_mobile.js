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
      
      // Clean up Cards
      content = content.replace(/<Card className="p-5 border-border bg-card shadow-xs rounded-3xl space-y-4">/g, '<Card className="space-y-4">');
      content = content.replace(/<Card className="p-4 border-border bg-card rounded-3xl">/g, '<Card>');
      content = content.replace(/<Card className="p-4 border-border bg-card shadow-xs rounded-3xl space-y-3">/g, '<Card className="space-y-3">');
      content = content.replace(/<Card className="shadow-lg border-border bg-card\/90 backdrop-blur-xl rounded-3xl p-5 overflow-hidden">/g, '<Card className="backdrop-blur-xl overflow-hidden">');
      content = content.replace(/<Card className="shadow-lg border-border bg-card rounded-3xl">/g, '<Card>');
      content = content.replace(/<Card className="shadow-xl border-border bg-card rounded-3xl overflow-hidden divide-y divide-border\/60">/g, '<Card className="overflow-hidden divide-y divide-border/60">');
      content = content.replace(/<Card className="shadow-lg border-border bg-card rounded-3xl p-2">/g, '<Card>');
      content = content.replace(/<Card className="border-border bg-card shadow-xs rounded-3xl overflow-hidden">/g, '<Card className="overflow-hidden">');
      content = content.replace(/<Card className="shadow-2xl border-border bg-card\/90 backdrop-blur-xl rounded-3xl p-2">/g, '<Card className="backdrop-blur-xl">');
      content = content.replace(/<Card className="border-border bg-card\/90 backdrop-blur-xl rounded-3xl animate-in slide-in-from-bottom duration-200">/g, '<Card className="backdrop-blur-xl animate-in slide-in-from-bottom duration-200">');
      content = content.replace(/<Card className="border-border bg-card shadow-xs rounded-3xl">/g, '<Card>');

      // Clean up typography
      content = content.replace(/font-serif-headline/g, 'font-display');
      content = content.replace(/font-display text-xl font-bold/g, 'font-display text-xl font-normal tracking-tighter');
      content = content.replace(/font-display text-2xl font-bold/g, 'font-display text-2xl font-normal tracking-tighter');
      content = content.replace(/font-display text-3xl font-bold/g, 'font-display text-3xl font-normal tracking-tighter');
      content = content.replace(/font-display text-4xl font-bold/g, 'font-display text-4xl font-normal tracking-tighter');
      content = content.replace(/font-display font-bold/g, 'font-display font-normal tracking-tighter');

      fs.writeFileSync(filePath, content);
    }
  });
}

processDir('/Users/vivan/Desktop/PROTOTYPE/mobile/src/pages');
processDir('/Users/vivan/Desktop/PROTOTYPE/mobile/src/components');
console.log("Updated mobile pages and components.");
