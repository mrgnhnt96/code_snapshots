import { CodeSnapshotGenerator } from './CodeSnapshotGenerator';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: npm run dev <path-to-dart-file> [output-path]');
        console.log('Example: npm run dev ./example.dart ./output.png');
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1] || './code-snapshot.png';

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
        console.error(`Error: File '${inputPath}' does not exist`);
        process.exit(1);
    }

    // Check if it's a Dart file
    if (!inputPath.endsWith('.dart')) {
        console.error(`Error: File '${inputPath}' is not a Dart file`);
        process.exit(1);
    }

    try {
        const code = fs.readFileSync(inputPath, 'utf-8');
        const generator = new CodeSnapshotGenerator();

        console.log(`Generating code snapshot for: ${inputPath}`);
        await generator.generateSnapshot(code, outputPath);
        console.log(`Snapshot saved to: ${outputPath}`);
    } catch (error) {
        console.error('Error generating code snapshot:', error);
        process.exit(1);
    }
}

main().catch(console.error); 
