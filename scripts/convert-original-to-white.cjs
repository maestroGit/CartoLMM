const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

const repoRoot = path.join(__dirname, '..');
const imagesDir = path.join(repoRoot, 'public', 'images');
const inputFile = path.join(imagesDir, 'iconoBWred.png');
const outFile = path.join(imagesDir, 'iconoBWwhite_fromorig.png');

(async () => {
  try {
    if (!fs.existsSync(inputFile)) {
      console.error('Input PNG not found:', inputFile);
      process.exit(1);
    }

    const meta = await sharp(inputFile).metadata();
    const width = meta.width || 64;
    const height = meta.height || 64;

    // Create a white background and use the original PNG as mask (dest-in) to keep shape
    const whiteBase = {
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    };

    await sharp(whiteBase)
      .composite([{ input: inputFile, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toFile(outFile);

    console.log('Generated white icon from original at', outFile);
  } catch (err) {
    console.error('Error generating white icon:', err);
    process.exit(2);
  }
})();
