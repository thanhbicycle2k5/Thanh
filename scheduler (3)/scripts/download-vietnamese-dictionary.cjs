const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const sourceUrl = 'https://raw.githubusercontent.com/yenthanh132/avdict-database-sqlite-converter/master/anhviet109K.txt';
const sourceFile = path.join(os.tmpdir(), 'anhviet109K.txt');

execFileSync('curl', ['-fsSL', '--retry', '3', '--max-time', '120', sourceUrl, '-o', sourceFile], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(__dirname, 'import-avdict.cjs'), sourceFile], { stdio: 'inherit' });
console.log('Vietnamese dictionary refreshed from the offline AVDict source.');
