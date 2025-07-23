import 'prismjs/components/prism-dart';
export declare class CodeSnapshotGenerator {
    private readonly width;
    private readonly height;
    private readonly padding;
    private readonly cardPadding;
    private readonly lineHeight;
    private readonly fontSize;
    generateSnapshot(code: string, outputPath: string): Promise<void>;
    private drawGradientBackground;
    private drawCodeCard;
    private drawRoundedRect;
    private drawCode;
    private drawLineNumbers;
    private drawHighlightedLine;
    private getTokenColor;
}
//# sourceMappingURL=CodeSnapshotGenerator.d.ts.map