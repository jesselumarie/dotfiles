// base64encode.js
const fs = require("fs");
const path = require("path");

// Input PNG path (you can pass as CLI arg)
const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node base64encode.js <image.png> [output.txt]");
  process.exit(1);
}

// Optional output path (default: image.png.base64.txt)
const outputPath =
  process.argv[3] || path.basename(inputPath) + ".base64.txt";

try {
  // Read the file as a buffer
  const imageBuffer = fs.readFileSync(inputPath);

  // Convert buffer to base64 string
  const base64Data = imageBuffer.toString("base64");

  // Optionally prepend the data URL header
  const dataUri = `data:image/png;base64,${base64Data}`;

  // Write to output file
  fs.writeFileSync(outputPath, dataUri, "utf8");

  console.log(`✅ Base64 file created: ${outputPath}`);
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
