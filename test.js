const { execSync } = require("child_process");

console.log("Testing Code Snapshot Generator...\n");

try {
  // Test 1: Default output path
  console.log("Test 1: Generating snapshot with default output path...");
  execSync("npm run dev ./example.dart", { stdio: "inherit" });
  console.log("✅ Test 1 passed\n");

  // Test 2: Custom output path
  console.log("Test 2: Generating snapshot with custom output path...");
  execSync("npm run dev ./example.dart ./custom-snapshot.png", {
    stdio: "inherit",
  });
  console.log("✅ Test 2 passed\n");

  // Test 3: Test with non-existent file (should fail)
  console.log(
    "Test 3: Testing with non-existent file (should fail gracefully)..."
  );
  try {
    execSync("npm run dev ./nonexistent.dart", { stdio: "inherit" });
  } catch (error) {
    console.log("✅ Test 3 passed - correctly handled non-existent file\n");
  }

  console.log("🎉 All tests completed successfully!");
  console.log("Generated files:");
  console.log("- code-snapshot.png");
  console.log("- custom-snapshot.png");
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}
