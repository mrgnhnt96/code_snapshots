import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-dart';
import { SnapshotConfig } from './types';

export class CodeSnapshotGenerator {
    private readonly config: SnapshotConfig;
    private readonly width: number;
    private readonly height: number;
    private readonly padding = 40;
    private readonly cardPadding = 20;
    private readonly lineHeight = 24;
    private readonly fontSize = 14;
    private readonly windowControlSize = 6;
    private readonly windowControlSpacing = 12;

    constructor(config: SnapshotConfig) {
        this.config = config;
        this.width = config.output.width != null ? config.output.width : 800; // Default width if null/undefined
        this.height = config.output.height != null ? config.output.height : 600; // Default height if null/undefined
    }

    async generateSnapshot(code: string, outputPath: string): Promise<void> {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // Draw gradient background
        this.drawGradientBackground(ctx);

        // Draw semi-transparent card
        this.drawCodeCard(ctx, code);

        // Save the image
        const buffer = canvas.toBuffer('image/png');
        const fs = await import('fs');
        fs.writeFileSync(outputPath, buffer);
    }

    private drawGradientBackground(ctx: CanvasRenderingContext2D): void {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.config.styling.backgroundColor);
        gradient.addColorStop(0.5, this.config.styling.gradientMiddleColor);
        gradient.addColorStop(1, this.config.styling.backgroundColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    private drawCodeCard(ctx: CanvasRenderingContext2D, code: string): void {
        const lines = code.split('\n');

        // Calculate text dimensions
        ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
        const textMetrics = this.calculateTextDimensions(ctx, lines);

        // Calculate card dimensions with proper spacing
        const topSpacing = this.config.styling.windowControl !== 'hidden' ? 45 : 20; // Increased space for window controls

        // Calculate content-based dimensions
        const contentWidth = textMetrics.maxWidth + 2 * this.cardPadding;
        const contentHeight = textMetrics.totalHeight + topSpacing + this.cardPadding;

        // If width/height are null/undefined, use content size with padding
        const maxCardWidth = this.config.output.width != null ? this.width - 2 * this.padding : contentWidth + 2 * this.padding;
        const maxCardHeight = this.config.output.height != null ? this.height - 2 * this.padding : contentHeight + 2 * this.padding;

        const cardWidth = Math.min(maxCardWidth, contentWidth);
        const cardHeight = Math.min(maxCardHeight, contentHeight);

        const cardX = (this.width - cardWidth) / 2;
        const cardY = (this.height - cardHeight) / 2;

        // Check for overflow and log warnings
        this.checkOverflow(textMetrics, cardWidth, cardHeight, topSpacing);

        // Draw semi-transparent card background
        const transparency = this.config.styling.cardTransparency;
        ctx.fillStyle = `rgba(30, 30, 30, ${transparency})`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        // Rounded rectangle
        this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 15);
        ctx.fill();

        // Draw macOS window controls if enabled
        if (this.config.styling.windowControl !== 'hidden') {
            this.drawWindowControls(ctx, cardX, cardY, cardWidth);
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw code with syntax highlighting
        const codeY = cardY + topSpacing;
        this.drawCode(ctx, code, cardX + this.cardPadding, codeY, cardWidth - 2 * this.cardPadding);
    }

    private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    private drawCode(ctx: CanvasRenderingContext2D, code: string, x: number, y: number, maxWidth: number): void {
        const lines = code.split('\n');

        // Set font
        ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
        ctx.textBaseline = 'top';

        // Draw line numbers if enabled
        if (this.config.styling.showLineNumbers) {
            this.drawLineNumbers(ctx, x + 10, y, lines.length); // Add 10px left padding to line numbers
            x += 25; // Reduce space between line numbers and code
        }

        // Draw code with syntax highlighting
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineY = y + i * this.lineHeight;

            // Highlight syntax for this line
            this.drawHighlightedLine(ctx, line, x, lineY, maxWidth - (this.config.styling.showLineNumbers ? 25 : 0));
        }
    }

    private drawLineNumbers(ctx: CanvasRenderingContext2D, x: number, y: number, lineCount: number): void {
        ctx.fillStyle = '#6b7280';
        ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
        ctx.textAlign = 'right';

        for (let i = 0; i < lineCount; i++) {
            const lineY = y + i * this.lineHeight;
            ctx.fillText((i + 1).toString(), x, lineY);
        }

        ctx.textAlign = 'left';
    }

    private calculateTextDimensions(ctx: CanvasRenderingContext2D, lines: string[]): { maxWidth: number; totalHeight: number } {
        let maxWidth = 0;
        const totalHeight = lines.length * this.lineHeight;

        for (const line of lines) {
            const tokens = Prism.tokenize(line, Prism.languages.dart);
            let lineWidth = 0;

            for (const token of tokens) {
                if (typeof token === 'string') {
                    lineWidth += ctx.measureText(token).width;
                } else if (token.type) {
                    lineWidth += ctx.measureText(String(token.content)).width;
                }
            }

            maxWidth = Math.max(maxWidth, lineWidth);
        }

        // Add space for line numbers if enabled
        if (this.config.styling.showLineNumbers) {
            maxWidth += 25;
        }

        return { maxWidth, totalHeight };
    }

    private checkOverflow(textMetrics: { maxWidth: number; totalHeight: number }, cardWidth: number, cardHeight: number, topSpacing: number): void {
        // Calculate the actual content area within the card
        const contentWidth = cardWidth - 2 * this.cardPadding;
        const contentHeight = cardHeight - topSpacing - this.cardPadding;

        // Check horizontal overflow (text width vs content area width)
        if (textMetrics.maxWidth > contentWidth) {
            const overflowX = textMetrics.maxWidth - contentWidth;
            console.log(`⚠️  Code extends past card content area horizontally by ${Math.round(overflowX)} pixels`);
            console.log(`   Consider increasing card width or reducing font size`);
        }

        // Check vertical overflow (text height vs content area height)
        if (textMetrics.totalHeight > contentHeight) {
            const overflowY = textMetrics.totalHeight - contentHeight;
            console.log(`⚠️  Code extends past card content area vertically by ${Math.round(overflowY)} pixels`);
            console.log(`   Consider increasing card height or reducing line count`);
        }
    }

    private drawHighlightedLine(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, maxWidth: number): void {
        // Use Prism.js to tokenize the line
        const tokens = Prism.tokenize(line, Prism.languages.dart);
        let currentX = x;

        for (const token of tokens) {
            if (typeof token === 'string') {
                // Plain text
                ctx.fillStyle = '#ffffff';
                ctx.fillText(token, currentX, y);
                currentX += ctx.measureText(token).width;
            } else if (token.type) {
                // Token with type
                const color = this.getTokenColor(token.type);
                ctx.fillStyle = color;

                // Handle nested tokens properly
                if (typeof token.content === 'string') {
                    ctx.fillText(token.content, currentX, y);
                    currentX += ctx.measureText(token.content).width;
                } else if (Array.isArray(token.content)) {
                    // Handle nested token arrays - render each token individually
                    for (const nestedToken of token.content) {
                        if (typeof nestedToken === 'string') {
                            ctx.fillText(nestedToken, currentX, y);
                            currentX += ctx.measureText(nestedToken).width;
                        } else if (nestedToken.type) {
                            const nestedColor = this.getTokenColor(nestedToken.type);
                            ctx.fillStyle = nestedColor;

                            if (typeof nestedToken.content === 'string') {
                                ctx.fillText(nestedToken.content, currentX, y);
                                currentX += ctx.measureText(nestedToken.content).width;
                            } else if (Array.isArray(nestedToken.content)) {
                                // Handle deeply nested arrays (like interpolation expressions)
                                for (const deepToken of nestedToken.content) {
                                    if (typeof deepToken === 'string') {
                                        ctx.fillText(deepToken, currentX, y);
                                        currentX += ctx.measureText(deepToken).width;
                                    } else if (deepToken.type) {
                                        const deepColor = this.getTokenColor(deepToken.type);
                                        ctx.fillStyle = deepColor;

                                        if (typeof deepToken.content === 'string') {
                                            ctx.fillText(deepToken.content, currentX, y);
                                            currentX += ctx.measureText(deepToken.content).width;
                                        } else if (Array.isArray(deepToken.content)) {
                                            // Handle the deepest level (like expression arrays)
                                            for (const deepestToken of deepToken.content) {
                                                if (typeof deepestToken === 'string') {
                                                    ctx.fillText(deepestToken, currentX, y);
                                                    currentX += ctx.measureText(deepestToken).width;
                                                } else if (deepestToken.type) {
                                                    const deepestColor = this.getTokenColor(deepestToken.type);
                                                    ctx.fillStyle = deepestColor;
                                                    const content = this.extractTokenContent(deepestToken);
                                                    ctx.fillText(content, currentX, y);
                                                    currentX += ctx.measureText(content).width;
                                                }
                                            }
                                        } else {
                                            const content = this.extractTokenContent(deepToken);
                                            ctx.fillText(content, currentX, y);
                                            currentX += ctx.measureText(content).width;
                                        }
                                    }
                                }
                            } else {
                                const content = this.extractTokenContent(nestedToken);
                                ctx.fillText(content, currentX, y);
                                currentX += ctx.measureText(content).width;
                            }
                        }
                    }
                } else {
                    // Fallback for other token types
                    const content = this.extractTokenContent(token);
                    ctx.fillText(content, currentX, y);
                    currentX += ctx.measureText(content).width;
                }
            }
        }
    }

    private extractTokenContent(token: any): string {
        if (typeof token.content === 'string') {
            return token.content;
        } else if (Array.isArray(token.content)) {
            return token.content.map((item: any) => this.extractTokenContent(item)).join('');
        } else if (token.content && typeof token.content === 'object') {
            // For complex nested objects, recursively extract content
            return this.extractTokenContent(token.content);
        } else {
            return String(token.content || '');
        }
    }

    private extractTokenContentFromArray(tokens: any[]): string {
        return tokens.map((token: any) => this.extractTokenContent(token)).join('');
    }

    private getTokenColor(type: string): string {
        switch (type) {
            case 'keyword':
                return '#c084fc'; // Purple
            case 'function':
            case 'method':
                return '#fbbf24'; // Yellow
            case 'string':
                return '#86efac'; // Green
            case 'number':
                return '#fb923c'; // Orange
            case 'comment':
                return '#6b7280'; // Gray
            case 'class-name':
                return '#60a5fa'; // Blue
            case 'variable':
                return '#93c5fd'; // Light blue
            case 'operator':
                return '#ffffff'; // White
            case 'punctuation':
                return '#ffffff'; // White
            default:
                return '#ffffff'; // White
        }
    }

    private drawWindowControls(ctx: CanvasRenderingContext2D, cardX: number, cardY: number, cardWidth: number): void {
        const controlY = cardY + 15;
        const startX = cardX + 20;
        const isOutlined = this.config.styling.windowControl === 'outlined';
        const controlSize = this.windowControlSize;

        // Close button (red)
        if (isOutlined) {
            ctx.strokeStyle = '#ff5f57';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(startX, controlY, controlSize, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#ff5f57';
            ctx.beginPath();
            ctx.arc(startX, controlY, controlSize, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Minimize button (yellow)
        if (isOutlined) {
            ctx.strokeStyle = '#ffbd2e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(startX + controlSize + this.windowControlSpacing, controlY, controlSize, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#ffbd2e';
            ctx.beginPath();
            ctx.arc(startX + controlSize + this.windowControlSpacing, controlY, controlSize, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Maximize button (green)
        if (isOutlined) {
            ctx.strokeStyle = '#28ca42';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(startX + 2 * (controlSize + this.windowControlSpacing), controlY, controlSize, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#28ca42';
            ctx.beginPath();
            ctx.arc(startX + 2 * (controlSize + this.windowControlSpacing), controlY, controlSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
} 
