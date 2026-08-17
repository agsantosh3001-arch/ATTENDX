const fs = require('fs');
const path = require('path');

const dir = '/Users/vivan/Desktop/PROTOTYPE/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Cards
  content = content.replace(/<Card className="p-5 border-border bg-card rounded-2xl shadow-sm">/g, '<Card>');
  content = content.replace(/<Card className="p-4 border-border">/g, '<Card>');
  content = content.replace(/<Card className="border-border">/g, '<Card>');
  content = content.replace(/<Card className="border-border max-w-2xl">/g, '<Card className="max-w-2xl">');
  content = content.replace(/<Card className="border-border w-full">/g, '<Card className="w-full">');
  content = content.replace(/<Card className="p-4 border-border bg-card shadow-xs rounded-2xl">/g, '<Card>');
  content = content.replace(/<Card className="border-border bg-card\/90 shadow-sm rounded-3xl overflow-hidden">/g, '<Card className="overflow-hidden">');
  content = content.replace(/<Card className="border-border bg-card shadow-sm rounded-3xl overflow-hidden">/g, '<Card className="overflow-hidden">');
  content = content.replace(/<div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-md">/g, '<div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-card p-6 sm:p-8 rounded-xl border border-border">');

  // Headlines
  content = content.replace(/<h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">/g, '<h1 className="font-display text-3xl sm:text-5xl font-normal tracking-tighter text-foreground">');
  content = content.replace(/<h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">/g, '<h1 className="font-display text-3xl sm:text-5xl font-normal tracking-tighter text-foreground flex items-center gap-3">');

  // Stats
  content = content.replace(/font-display text-3xl font-extrabold (.*?) tracking-tight/g, 'font-display text-3xl font-normal tracking-tighter $1');

  fs.writeFileSync(filePath, content);
});
console.log("Updated frontend pages.");
