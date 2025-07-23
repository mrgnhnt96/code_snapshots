const { execSync } = require("child_process");
const fs = require("fs");

console.log("Testing Code Snapshot Generator...\n");

try {
  // Test 1: Default config
  console.log("Test 1: Generating snapshot with default config...");
  execSync("npm run dev ./config.yaml", { stdio: "inherit" });
  console.log("✅ Test 1 passed\n");

  // Test 2: Custom config
  console.log("Test 2: Generating snapshot with custom config...");
  const customConfig = {
    input: {
      file: "./example.dart",
      startLine: 1,
      endLine: 10,
    },
    output: {
      path: "./custom-snapshot.png",
      width: 900,
      height: 700,
    },
    styling: {
      cardTransparency: 0.7,
      showWindowControls: true,
      backgroundColor: "#1e3a8a",
      gradientMiddleColor: "#3b82f6",
    },
  };

  fs.writeFileSync("./test-config.yaml", require("js-yaml").dump(customConfig));
  execSync("npm run dev ./test-config.yaml", { stdio: "inherit" });
  console.log("✅ Test 2 passed\n");

  // Test 3: Test with non-existent config file (should fail)
  console.log(
    "Test 3: Testing with non-existent config file (should fail gracefully)..."
  );
  try {
    execSync("npm run dev ./nonexistent.yaml", { stdio: "inherit" });
  } catch (error) {
    console.log(
      "✅ Test 3 passed - correctly handled non-existent config file\n"
    );
  }

  // Clean up test config
  if (fs.existsSync("./test-config.yaml")) {
    fs.unlinkSync("./test-config.yaml");
  }

  console.log("🎉 All tests completed successfully!");
  console.log("Generated files:");
  console.log("- code-snapshot.png");
  console.log("- custom-snapshot.png");
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}
