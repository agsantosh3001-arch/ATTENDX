const fs = require('fs');
const path = require('path');

const dir = '/Users/vivan/Desktop/PROTOTYPE/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix EmployeeDashboard & others with p-0 headers
  content = content.replace(/<Card>\s*<CardHeader className="p-0/g, '<Card className="p-6">\n            <CardHeader className="p-0');
  
  // Fix KPI cards
  content = content.replace(/<Card>\s*<div className="flex items-center justify-between">/g, '<Card className="p-6">\n          <div className="flex items-center justify-between">');

  // Any other cards that might have lost padding where they don't have CardHeader
  // Check ReportsPage.tsx graph card:
  content = content.replace(/<Card className="w-full">\s*<CardHeader className="flex/g, '<Card className="w-full p-6">\n        <CardHeader className="flex');

  // Fix AdminDashboard.tsx settings card
  content = content.replace(/<Card className="max-w-2xl">/g, '<Card className="max-w-2xl p-6">');

  fs.writeFileSync(filePath, content);
});
console.log("Fixed Card paddings.");
