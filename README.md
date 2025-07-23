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
npm run dev <path-to-dart-file> [output-path]
```

### Production Mode

```bash
npm run start <path-to-dart-file> [output-path]
```

### Examples

Generate a snapshot from the example file:

```bash
npm run dev ./example.dart
```

Generate a snapshot with custom output path:

```bash
npm run dev ./example.dart ./my-snapshot.png
```

## Example Output

The generator will create a PNG image with:

- Blue gradient background (dark blue at top/bottom, lighter in middle)
- Semi-transparent dark card with rounded corners
- Syntax-highlighted Dart code with line numbers
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
│   └── CodeSnapshotGenerator.ts  # Core snapshot generation logic
├── example.dart              # Example Dart file for testing
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Dependencies

- **canvas**: For image generation
- **prismjs**: For Dart syntax highlighting
- **typescript**: For TypeScript compilation
- **@types/node**: TypeScript definitions for Node.js

## Customization

You can modify the appearance by editing the constants in `CodeSnapshotGenerator.ts`:

- `width` and `height`: Image dimensions
- `padding`: Outer padding
- `cardPadding`: Inner card padding
- `lineHeight`: Line spacing
- `fontSize`: Text size
- Colors in `getTokenColor()` method
- Gradient colors in `drawGradientBackground()`
