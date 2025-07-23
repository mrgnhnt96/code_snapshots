import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-dart';

export class CodeSnapshotGenerator {
    private readonly width = 800;
    private readonly height = 600;
    private readonly padding = 40;
    private readonly cardPadding = 20;
    private readonly lineHeight = 24;
    private readonly fontSize = 14;

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
        gradient.addColorStop(0, '#1e3a8a');   // Dark blue at top
        gradient.addColorStop(0.5, '#3b82f6'); // Medium blue in middle
        gradient.addColorStop(1, '#1e3a8a');   // Dark blue at bottom

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    private drawCodeCard(ctx: CanvasRenderingContext2D, code: string): void {
        const lines = code.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));

        // Calculate card dimensions
        const cardWidth = Math.min(this.width - 2 * this.padding, maxLineLength * 8 + 2 * this.cardPadding);
        const cardHeight = Math.min(this.height - 2 * this.padding, lines.length * this.lineHeight + 2 * this.cardPadding);

        const cardX = (this.width - cardWidth) / 2;
        const cardY = (this.height - cardHeight) / 2;

        // Draw semi-transparent card background
        ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        // Rounded rectangle
        this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 15);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw code with syntax highlighting
        this.drawCode(ctx, code, cardX + this.cardPadding, cardY + this.cardPadding, cardWidth - 2 * this.cardPadding);
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

        // Draw line numbers
        this.drawLineNumbers(ctx, x - 30, y, lines.length);

        // Draw code with syntax highlighting
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineY = y + i * this.lineHeight;

            // Highlight syntax for this line
            this.drawHighlightedLine(ctx, line, x, lineY, maxWidth);
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
                const content = String(token.content);
                ctx.fillText(content, currentX, y);
                currentX += ctx.measureText(content).width;
            }
        }
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
} 
