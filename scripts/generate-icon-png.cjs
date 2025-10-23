// CommonJS version to generate PNG from SVG using sharp
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'images', 'iconoBWwhite.svg');
const outPng = path.join(__dirname, '..', 'public', 'images', 'iconoBWwhite.png');

(async () => {
  try {
    if (!fs.existsSync(svgPath)) {
      console.error('SVG not found:', svgPath);
      process.exit(1);
    }
    let sharp;
    try { sharp = require('sharp'); } catch (err) {
      console.error('sharp not installed. Install with: npm install sharp --save-dev');
      process.exit(1);
    }

    const svg = fs.readFileSync(svgPath);
    await sharp(svg)
      .resize(64, 64)
      .png({ compressionLevel: 9 })
      .toFile(outPng);

    console.log('Generated PNG at', outPng);
  } catch (err) {
    console.error('Failed to generate PNG:', err);
    process.exit(2);
  }
})();
