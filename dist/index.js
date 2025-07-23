"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const CodeSnapshotGenerator_1 = require("./CodeSnapshotGenerator");
const fs = __importStar(require("fs"));
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
        const generator = new CodeSnapshotGenerator_1.CodeSnapshotGenerator();
        console.log(`Generating code snapshot for: ${inputPath}`);
        await generator.generateSnapshot(code, outputPath);
        console.log(`Snapshot saved to: ${outputPath}`);
    }
    catch (error) {
        console.error('Error generating code snapshot:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=index.js.map