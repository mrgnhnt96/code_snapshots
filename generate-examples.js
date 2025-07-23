#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Function to get all YAML files from assets/themes directory
function getThemeFiles() {
  const themesDir = path.join(__dirname, "assets", "themes");

  // Create directory if it doesn't exist
  if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
    console.log("📁 Created assets/themes directory");
  }

  try {
    const files = fs.readdirSync(themesDir);
    return files
      .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
      .map((file) => path.join(themesDir, file));
  } catch (error) {
    console.error("❌ Error reading themes directory:", error.message);
    return [];
  }
}

const themeFiles = getThemeFiles();

if (themeFiles.length === 0) {
  console.log("📁 No theme files found in assets/themes directory");
  console.log(
    "💡 Create some .yaml files in assets/themes/ to generate examples"
  );
  process.exit(0);
}

console.log("🎨 Generating theme examples...\n");

themeFiles.forEach((themeFile) => {
  try {
    const themeName = path.basename(themeFile, path.extname(themeFile));
    console.log(`Generating ${themeName} theme...`);
    execSync(`npm run dev "${themeFile}"`, {
      stdio: "inherit",
    });
    console.log(`✅ ${themeName} theme generated successfully!\n`);
  } catch (error) {
    console.error(
      `❌ Failed to generate ${path.basename(themeFile)} theme:`,
      error.message
    );
  }
});

console.log("🎉 All theme examples generated!");
console.log("📁 Check the assets/ directory for the generated images.");
