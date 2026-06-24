const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dist', 'index.html');
const distDir = path.join(__dirname, 'dist');
const textFileExtensions = new Set(['.html', '.js', '.css', '.json', '.map']);

function rewritePaths(content) {
  return content
    .replace(/href="\/(?!studentMate\/)/g, 'href="/studentMate/')
    .replace(/src="\/(?!studentMate\/)/g, 'src="/studentMate/')
    .replace(/(["'`(=:\s])\/assets\//g, '$1/studentMate/assets/')
    .replace(/(["'`(=:\s])\/_expo\//g, '$1/studentMate/_expo/')
    .replace(/(["'`(=:\s])\/favicon\.ico/g, '$1/studentMate/favicon.ico');
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
      continue;
    }

    if (!textFileExtensions.has(path.extname(entry.name))) {
      continue;
    }

    const original = fs.readFileSync(fullPath, 'utf8');
    const updated = rewritePaths(original);
    if (updated !== original) {
      fs.writeFileSync(fullPath, updated, 'utf8');
    }
  }
}

let html = fs.readFileSync(htmlPath, 'utf8');
html = rewritePaths(html);
fs.writeFileSync(htmlPath, html, 'utf8');
processDirectory(distDir);
console.log('Fixed GitHub Pages paths in exported web files');

// Copy index.html to 404.html for SPA routing on GitHub Pages
const notFoundPath = path.join(__dirname, 'dist', '404.html');
fs.writeFileSync(notFoundPath, html, 'utf8');
console.log('Created 404.html for SPA routing');

const noJekyllPath = path.join(__dirname, 'dist', '.nojekyll');
fs.writeFileSync(noJekyllPath, '', 'utf8');
console.log('Created .nojekyll for GitHub Pages');

// Copy vector icon fonts to the exact nested path the bundle requests
const fontsSource = path.join(__dirname, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
const fontsDest = path.join(__dirname, 'dist', 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');

if (!fs.existsSync(fontsDest)) {
  fs.mkdirSync(fontsDest, { recursive: true });
}

const fontFiles = fs.readdirSync(fontsSource).filter(f => f.endsWith('.ttf'));
fontFiles.forEach(font => {
  // Find the hashed version of this font referenced in the bundle
  const jsBundleDir = path.join(__dirname, 'dist', '_expo', 'static', 'js', 'web');
  let bundleContent = '';
  if (fs.existsSync(jsBundleDir)) {
    fs.readdirSync(jsBundleDir).filter(f => f.endsWith('.js')).forEach(f => {
      bundleContent += fs.readFileSync(path.join(jsBundleDir, f), 'utf8');
    });
  }

  const baseName = path.basename(font, '.ttf');
  const regex = new RegExp(`${baseName}\\.[a-f0-9]{32}\\.ttf`);
  const match = bundleContent.match(regex);
  const hashedName = match ? match[0] : font;

  const srcFile = path.join(fontsSource, font);
  const destFile = path.join(fontsDest, hashedName);
  fs.copyFileSync(srcFile, destFile);
  console.log(`Copied font: ${hashedName}`);
});

console.log('Font copy complete.');