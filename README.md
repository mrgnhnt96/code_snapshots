# Code Snapshot Generator

A TypeScript project that creates beautiful code snapshots with Dart syntax highlighting, similar to the image you provided. The generator creates a semi-transparent card with syntax-highlighted code on a gradient background.

## Features

- 🎨 Beautiful gradient background
- 📄 Semi-transparent code card with rounded corners
- 🎯 Dart syntax highlighting support
- 📝 Line numbers
- 💾 Outputs high-quality PNG images
- 🖼️ Similar styling to the reference image

## Installation

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

## Usage

### Development Mode

```bash
npm run dev <path-to-config-file>
```

### Production Mode

```bash
npm run start <path-to-config-file>
```

### Examples

Generate a snapshot using the default config:

```bash
npm run dev ./config.yaml
```

Generate a snapshot with custom config:

```bash
npm run dev ./my-config.yaml
```

## Configuration

The generator uses YAML configuration files to specify input, output, and styling options:

```yaml
# Code Snapshot Configuration
input:
  file: "./example.dart" # Path to Dart file
  startLine: 37 # Starting line number (inclusive)
  endLine: 46 # Ending line number (inclusive)

output:
  path: "./code-snapshot.png" # Output file path
  width: 800 # Image width
  height: 600 # Image height

styling:
  cardTransparency: 0.8 # Card transparency (0.0-1.0)
  showWindowControls: true # Show macOS-style window controls
  backgroundColor: "#1e3a8a" # Dark blue for gradient
  gradientMiddleColor: "#3b82f6" # Medium blue for gradient middle
  showLineNumbers: true # Show line numbers
  showFileName: true # Show file name (future feature)
  windowControlStyle: "filled" # "filled" or "outlined" circles
```

### VS Code IntelliSense

For better editing experience, you can add the included JSON schema to your VS Code settings. See [VSCODE_SETUP.md](./VSCODE_SETUP.md) for detailed instructions.

## Example Output

The generator will create a PNG image with:

- Blue gradient background (dark blue at top/bottom, lighter in middle)
- Semi-transparent dark card with rounded corners and macOS-style window controls
- Syntax-highlighted Dart code with optional line numbers
- Overflow detection with console warnings for text that extends past card boundaries
- Color scheme:
  - Keywords: Purple
  - Functions/Methods: Yellow
  - Strings: Green
  - Numbers: Orange
  - Comments: Gray
  - Class names: Blue
  - Variables: Light blue
  - Operators/Punctuation: White

## Project Structure

```
├── src/
│   ├── index.ts              # Main entry point
│   ├── CodeSnapshotGenerator.ts  # Core snapshot generation logic
│   └── types.ts              # TypeScript interfaces
├── example.dart              # Example Dart file for testing
├── config.yaml               # Configuration file
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Dependencies

- **canvas**: For image generation
- **prismjs**: For Dart syntax highlighting
- **js-yaml**: For YAML configuration parsing
- **typescript**: For TypeScript compilation
- **@types/node**: TypeScript definitions for Node.js

## Customization

You can customize the appearance by modifying the `config.yaml` file:

- **Image dimensions**: `output.width` and `output.height`
- **Card transparency**: `styling.cardTransparency` (0.0-1.0)
- **Window controls**: `styling.showWindowControls` (true/false)
- **Window control style**: `styling.windowControlStyle` ("filled" or "outlined")
- **Line numbers**: `styling.showLineNumbers` (true/false)
- **File name display**: `styling.showFileName` (true/false)
- **Background colors**: `styling.backgroundColor` and `styling.gradientMiddleColor`
- **Code selection**: `input.startLine` and `input.endLine`

### Overflow Detection

The generator automatically detects when code extends beyond the card's content area and logs helpful warnings:

```
⚠️  Code extends past card content area horizontally by 239 pixels
   Consider increasing card width or reducing font size
⚠️  Code extends past card content area vertically by 90 pixels
   Consider increasing card height or reducing line count
```

For advanced customization, you can also modify the constants in `CodeSnapshotGenerator.ts`:

- `padding`: Outer padding
- `cardPadding`: Inner card padding
- `lineHeight`: Line spacing
- `fontSize`: Text size
- `windowControlSize`: Size of window control circles (8px)
- `windowControlSpacing`: Spacing between window controls (12px)
- Colors in `getTokenColor()` method
