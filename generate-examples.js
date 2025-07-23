#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

const themes = [
  "dracula",
  "github-dark",
  "material-dark",
  "nord",
  "tokyo-night",
  "one-dark",
  "monokai",
];

console.log("🎨 Generating theme examples...\n");

themes.forEach((theme) => {
  try {
    console.log(`Generating ${theme} theme...`);
    execSync(`node dist/index.js assets/themes/${theme}.yaml`, {
      stdio: "inherit",
    });
    console.log(`✅ ${theme} theme generated successfully!\n`);
  } catch (error) {
    console.error(`❌ Failed to generate ${theme} theme:`, error.message);
  }
});

console.log("🎉 All theme examples generated!");
console.log("📁 Check the assets/ directory for the generated images.");
