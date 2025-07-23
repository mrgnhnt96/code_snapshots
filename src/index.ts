import { CodeSnapshotGenerator } from './CodeSnapshotGenerator';
import { SnapshotConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: npm run dev <path-to-config-file>');
        console.log('Example: npm run dev ./config.yaml');
        process.exit(1);
    }

    const configPath = args[0];

    // Check if config file exists
    if (!fs.existsSync(configPath)) {
        console.error(`Error: Config file '${configPath}' does not exist`);
        process.exit(1);
    }

    try {
        // Load and parse YAML config
        const configFile = fs.readFileSync(configPath, 'utf-8');
        const config: SnapshotConfig = yaml.load(configFile) as SnapshotConfig;

        // Validate config
        if (!config.input?.file || !fs.existsSync(config.input.file)) {
            console.error(`Error: Input file '${config.input?.file}' does not exist`);
            process.exit(1);
        }

        // Read the Dart file
        const fullCode = fs.readFileSync(config.input.file, 'utf-8');
        const lines = fullCode.split('\n');

        // Extract the specified lines
        const startLine = Math.max(0, config.input.startLine - 1); // Convert to 0-based index
        const endLine = Math.min(lines.length, config.input.endLine);
        const selectedLines = lines.slice(startLine, endLine);
        const code = selectedLines.join('\n');

        console.log(`Generating code snapshot for: ${config.input.file} (lines ${config.input.startLine}-${config.input.endLine})`);

        const generator = new CodeSnapshotGenerator(config);
        await generator.generateSnapshot(code, config.output.path);
        console.log(`Snapshot saved to: ${config.output.path}`);
    } catch (error) {
        console.error('Error generating code snapshot:', error);
        process.exit(1);
    }
}

main().catch(console.error); 
