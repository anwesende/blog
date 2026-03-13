const fs = require('node:fs');

const htmlPath = 'docs/public/calorie-calculator.html';
const eatOutPath = 'docs/public/食谱.json';
const workoutOutPath = 'docs/public/运动安排.json';

const html = fs.readFileSync(htmlPath, 'utf8');

const eatMatch = html.match(/eat_json\s*:\s*({[\s\S]*?})\s*,\s*sport_json\s*:\s*\[/);
if (!eatMatch) {
  throw new Error('Failed to find eat_json object in ' + htmlPath);
}

const sportMatch = html.match(/sport_json\s*:\s*(\[[\s\S]*?\])\s*,\s*\/\/\s*晚餐食物营养成分/);
if (!sportMatch) {
  throw new Error('Failed to find sport_json array in ' + htmlPath);
}

// The literals in the HTML are JS object/array literals (JSON-compatible strings),
// so evaluating them is the simplest reliable extraction method.
const eatObj = new Function(`return (${eatMatch[1]});`)();
const sportArr = new Function(`return (${sportMatch[1]});`)();

fs.writeFileSync(eatOutPath, JSON.stringify(eatObj, null, 2));
fs.writeFileSync(workoutOutPath, JSON.stringify(sportArr, null, 2));

console.log('Wrote:', eatOutPath, 'days=', Object.keys(eatObj).length);
console.log('Wrote:', workoutOutPath, 'rows=', Array.isArray(sportArr) ? sportArr.length : 0);
