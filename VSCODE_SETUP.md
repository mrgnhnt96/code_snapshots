# VS Code Setup for Code Snapshot Generator

This guide shows you how to set up VS Code to provide IntelliSense, autocomplete, and validation for your code snapshot YAML configuration files.

## Setup Instructions

### 1. Add Schema to VS Code Settings

Open your VS Code settings (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux) and add the following to your `settings.json`:

```json
{
  "yaml.schemas": {
    "./code-snapshot-schema.json": [
      "**/config.yaml",
      "**/*-config.yaml",
      "**/snapshot-config.yaml"
    ]
  }
}
```

### 2. Alternative: Workspace Settings

If you prefer to keep this setting only for this project, create a `.vscode/settings.json` file in your project root:

```json
{
  "yaml.schemas": {
    "./code-snapshot-schema.json": [
      "**/config.yaml",
      "**/*-config.yaml",
      "**/snapshot-config.yaml"
    ]
  }
}
```

### 3. Global Setup (Optional)

For global use across all projects, add this to your global VS Code settings:

```json
{
  "yaml.schemas": {
    "/path/to/code-snapshot-schema.json": [
      "**/config.yaml",
      "**/*-config.yaml",
      "**/snapshot-config.yaml"
    ]
  }
}
```

## Features You'll Get

Once configured, you'll have:

- **Autocomplete**: Type `input:` and get suggestions for all available properties
- **Validation**: VS Code will highlight errors if you use invalid values
- **Hover Help**: Hover over properties to see descriptions and examples
- **IntelliSense**: Smart suggestions for enum values (like `"filled"` vs `"outlined"`)
- **Type Checking**: Validation for data types (integers, booleans, hex colors)

## Example Usage

With the schema enabled, when you type in your `config.yaml`:

```yaml
input:
  file: "./example.dart" # ← Autocomplete will suggest .dart files
  startLine: 37 # ← Will validate it's a positive integer
  endLine: 46

output:
  path: "./output.png" # ← Will validate it ends with .png
  width: 800 # ← Will validate it's between 200-2000
  height: 600

styling:
  cardTransparency: 0.8 # ← Will validate it's between 0.0-1.0
  showWindowControls: true # ← Will suggest true/false
  windowControlStyle: "filled" # ← Will suggest "filled" or "outlined"
  backgroundColor: "#1e3a8a" # ← Will validate hex color format
```

## Troubleshooting

If autocomplete isn't working:

1. Make sure the schema file path is correct
2. Restart VS Code after adding the settings
3. Check that your YAML file matches one of the patterns in the settings
4. Verify the schema file is valid JSON

## Schema Features

The schema includes:

- **Validation**: Ensures all required fields are present
- **Type Checking**: Validates data types and ranges
- **Pattern Matching**: Ensures file paths end with `.dart` and `.png`
- **Enums**: Restricts values to valid options
- **Examples**: Provides helpful examples for each field
- **Descriptions**: Detailed explanations of each property

## ✅ YAML Schema Created!

I've created a comprehensive JSON schema for VS Code that will make editing your YAML configuration files much easier!

### **📁 New Files Created:**

1. **`code-snapshot-schema.json`** - The JSON schema file with full validation
2. **`VSCODE_SETUP.md`** - Complete setup guide for VS Code integration

### **🎯 Schema Features:**

- **Autocomplete**: Type `input:` and get suggestions for all properties
- **Validation**: Highlights errors for invalid values
- **Hover Help**: Detailed descriptions for each property
- **Type Checking**: Validates integers, booleans, hex colors
- **Pattern Matching**: Ensures `.dart` and `.png` file extensions
- **Enums**: Suggests valid options like `"filled"` vs `"outlined"`

### **⚙️ Quick Setup:**

Add this to your VS Code `settings.json`:

```json
<code_block_to_apply_changes_from>
```

### **🎨 What You'll Get:**

- **Smart autocomplete** for all configuration options
- **Real-time validation** with helpful error messages
- **IntelliSense** for color values, boolean options, and enums
- **Hover tooltips** with descriptions and examples

The schema covers all your configuration options including the new features like line numbers, window control styles, and transparency settings. This will make creating and editing configuration files much more user-friendly! 🚀
