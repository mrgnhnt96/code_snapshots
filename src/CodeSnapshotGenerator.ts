import { createCanvas, Canvas, CanvasRenderingContext2D, Image } from 'canvas';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-dart';
import { SnapshotConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class CodeSnapshotGenerator {
    private readonly config: SnapshotConfig;
    private width: number;
    private height: number;
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
        // Calculate proper dimensions when auto-sizing
        const { canvasWidth, canvasHeight } = this.calculateCanvasDimensions(code);

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Update width/height for this generation
        this.width = canvasWidth;
        this.height = canvasHeight;

        // Apply image border radius clipping if specified
        const imageBorderRadius = this.config.styling.imageBorderRadius;
        if (imageBorderRadius && imageBorderRadius > 0) {
            this.applyImageBorderRadius(ctx, imageBorderRadius);
        }

        // Draw background
        this.drawBackground(ctx);

        // Draw semi-transparent card
        this.drawCodeCard(ctx, code);

        // Restore context if clipping was applied
        if (imageBorderRadius && imageBorderRadius > 0) {
            ctx.restore();
        }

        // Save the image
        const buffer = canvas.toBuffer('image/png');
        const fs = await import('fs');
        fs.writeFileSync(outputPath, buffer);
    }

    private calculateCanvasDimensions(code: string): { canvasWidth: number; canvasHeight: number } {
        // Create a temporary canvas to measure text
        const tempCanvas = createCanvas(1, 1);
        const tempCtx = tempCanvas.getContext('2d');

        const lines = code.split('\n');
        tempCtx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
        const textMetrics = this.calculateTextDimensions(tempCtx, lines);

        // Calculate content dimensions
        let topSpacing = this.config.styling.windowControl !== 'hidden' ? 45 : 25;

        // Add space for file header if fileName is specified
        if (this.config.styling.fileName) {
            topSpacing += 14; // Reduced space for file header (20px header - 6px spacing)
        }

        const contentWidth = textMetrics.maxWidth + 2 * this.cardPadding;
        let contentHeight = textMetrics.totalHeight + topSpacing + this.cardPadding;

        // Add space for lint messages card if enabled
        if (this.config.styling.showLintMessages && this.config.input.lints && this.config.input.lints.length > 0) {
            const lintsWithMessages = this.config.input.lints.filter(lint => lint.message);
            if (lintsWithMessages.length > 0) {
                const gap = 24;
                const lineHeight = 20;
                const itemSpacing = 8;
                const lintCardHeight = lintsWithMessages.length * (lineHeight + itemSpacing) - itemSpacing + 2 * this.cardPadding;
                contentHeight += gap + lintCardHeight;
            }
        }

        // Get margin values
        const horizontalMargin = this.config.styling.cardMargin?.horizontal ?? 40;
        const verticalMargin = this.config.styling.cardMargin?.vertical ?? 40;

        // Calculate canvas dimensions
        let canvasWidth: number;
        let canvasHeight: number;

        if (this.config.output.width != null) {
            canvasWidth = this.config.output.width;
        } else {
            // Auto width: content width + margins
            canvasWidth = contentWidth + 2 * horizontalMargin;
        }

        if (this.config.output.height != null) {
            canvasHeight = this.config.output.height;
        } else {
            // Auto height: content height + margins
            canvasHeight = contentHeight + 2 * verticalMargin;
        }

        return { canvasWidth, canvasHeight };
    }

    private drawBackground(ctx: CanvasRenderingContext2D): void {
        const background = this.config.styling.background;

        switch (background.type) {
            case 'transparent':
                // Do nothing - leave canvas transparent
                return;

            case 'filled':
                if (background.color) {
                    ctx.fillStyle = background.color;
                    ctx.fillRect(0, 0, this.width, this.height);
                }
                break;

            case 'gradient':
                if (background.colors && background.colors.length > 0) {
                    // Get gradient direction with default fallback
                    const direction = background.direction || 'to-bottom';

                    // Calculate gradient coordinates based on direction
                    const { x0, y0, x1, y1 } = this.getGradientCoordinates(direction);

                    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

                    // Sort colors by stop position
                    const sortedColors = [...background.colors].sort((a, b) => a.stop - b.stop);

                    // Add color stops
                    for (const colorStop of sortedColors) {
                        gradient.addColorStop(colorStop.stop, colorStop.color);
                    }

                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, this.width, this.height);
                }
                break;
        }
    }

    private getGradientCoordinates(direction: string): { x0: number; y0: number; x1: number; y1: number } {
        switch (direction) {
            case 'to-bottom':
                return { x0: 0, y0: 0, x1: 0, y1: this.height };
            case 'to-top':
                return { x0: 0, y0: this.height, x1: 0, y1: 0 };
            case 'to-right':
                return { x0: 0, y0: 0, x1: this.width, y1: 0 };
            case 'to-left':
                return { x0: this.width, y0: 0, x1: 0, y1: 0 };
            case 'to-bottom-right':
                return { x0: 0, y0: 0, x1: this.width, y1: this.height };
            case 'to-bottom-left':
                return { x0: this.width, y0: 0, x1: 0, y1: this.height };
            case 'to-top-right':
                return { x0: 0, y0: this.height, x1: this.width, y1: 0 };
            case 'to-top-left':
                return { x0: this.width, y0: this.height, x1: 0, y1: 0 };
            default:
                // Default to to-bottom
                return { x0: 0, y0: 0, x1: 0, y1: this.height };
        }
    }

    private drawCodeCard(ctx: CanvasRenderingContext2D, code: string): void {
        const lines = code.split('\n');

        // Calculate text dimensions
        ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
        const textMetrics = this.calculateTextDimensions(ctx, lines);

        // Calculate card dimensions with proper spacing
        let topSpacing = this.config.styling.windowControl !== 'hidden' ? 45 : 25; // Increased space for window controls

        // Add space for file header if fileName is specified
        if (this.config.styling.fileName) {
            topSpacing += 14; // Reduced space for file header (20px header - 6px spacing)
        }

        // Calculate content-based dimensions
        const contentWidth = textMetrics.maxWidth + 2 * this.cardPadding;
        const contentHeight = textMetrics.totalHeight + topSpacing + this.cardPadding;

        // Get configurable margin values with defaults
        const horizontalMargin = this.config.styling.cardMargin?.horizontal ?? 40;
        const verticalMargin = this.config.styling.cardMargin?.vertical ?? 40;

        // Card dimensions are now content size (canvas is sized to accommodate card + margins)
        const cardWidth = contentWidth;
        const cardHeight = contentHeight;

        // Calculate total height needed for both cards when lint messages are enabled
        let totalCardsHeight = cardHeight;
        if (this.config.styling.showLintMessages && this.config.input.lints && this.config.input.lints.length > 0) {
            const lintsWithMessages = this.config.input.lints.filter(lint => lint.message);
            if (lintsWithMessages.length > 0) {
                const gap = 24;
                const lineHeight = 20;
                const itemSpacing = 8;
                const lintCardHeight = lintsWithMessages.length * (lineHeight + itemSpacing) - itemSpacing + 2 * this.cardPadding;
                totalCardsHeight += gap + lintCardHeight;
            }
        }

        const cardX = (this.width - cardWidth) / 2;
        const cardY = (this.height - totalCardsHeight) / 2;

        // Check for overflow and log warnings
        this.checkOverflow(textMetrics, cardWidth, cardHeight, topSpacing);

        // Draw card background
        const cardBackground = this.config.styling.cardBackground;
        const transparency = cardBackground?.transparency ?? 0.8; // Default to 0.8 if not specified
        const borderRadius = this.config.styling.borderRadius ?? 15; // Default to 15 if not specified

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        if (cardBackground?.type === 'layered' && cardBackground.color && cardBackground.partialBackgroundColor) {
            // Draw layered background - partial background color spans full width, main color overlays with slant
            const midX = cardX + cardWidth / 2;
            const slantOffset = cardHeight * 0.15; // Match the slant from the drawing methods

            // Draw full-width partial background first (underneath)
            const partialRgba = this.hexToRgba(cardBackground.partialBackgroundColor, transparency);
            ctx.fillStyle = partialRgba;
            this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
            ctx.fill();

            // Reset shadow before drawing overlay
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw main color on top with slant - configurable transparency
            const partialTransparency = cardBackground.partialTransparency ?? 0.3; // Default to 0.3 if not specified
            const mainTransparency = partialTransparency; // Use partialTransparency directly as the overlay transparency

            // Create gradient mask for blur effect - follow the slant
            const gradientWidth = 20; // Width of the blur transition
            const gradient = ctx.createLinearGradient(
                cardX + cardWidth / 2 - gradientWidth, cardY,
                cardX + cardWidth / 2 + slantOffset, cardY + cardHeight
            );
            gradient.addColorStop(0, this.hexToRgba(cardBackground.color, mainTransparency));
            gradient.addColorStop(0.7, this.hexToRgba(cardBackground.color, mainTransparency * 0.5)); // Keep some opacity for text contrast
            gradient.addColorStop(1, this.hexToRgba(cardBackground.color, 0));

            ctx.fillStyle = gradient;
            this.drawSplitLeftRect(ctx, cardX, cardY, cardWidth / 2, cardHeight, borderRadius);
            ctx.fill();
        } else {
            // Draw solid background (default or explicit solid)
            const color = cardBackground?.color || '#1e1e1e';
            const rgba = this.hexToRgba(color, transparency);
            ctx.fillStyle = rgba;
            this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
            ctx.fill();
        }

        // Draw borders
        // Black border (0.8px) - on the outermost edge
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 0.8;
        this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
        ctx.stroke();

        // Light gray/white border (1px) - drawn slightly inside
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, cardX + 0.5, cardY + 0.5, cardWidth - 1, cardHeight - 1, borderRadius);
        ctx.stroke();

        // Draw macOS window controls if enabled
        if (this.config.styling.windowControl !== 'hidden') {
            this.drawWindowControls(ctx, cardX, cardY, cardWidth);
        }

        // Reset shadow before drawing file header
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw file header if fileName is specified
        if (this.config.styling.fileName) {
            this.drawFileHeader(ctx, cardX, cardY, cardWidth);
        }

        // Draw code with syntax highlighting
        const codeY = cardY + topSpacing;
        this.drawCode(ctx, code, cardX + this.cardPadding, codeY, cardWidth - 2 * this.cardPadding);

        // Draw lints if specified
        if (this.config.input.lints && this.config.input.lints.length > 0) {
            // Adjust x position for line numbers if they are shown
            let lintX = cardX + this.cardPadding;
            if (this.config.styling.showLineNumbers) {
                lintX += 25; // Match the offset used in drawCode method
            }
            this.drawLints(ctx, code, lintX, codeY, cardWidth - 2 * this.cardPadding);
        }

        // Draw lint messages card if enabled
        if (this.config.styling.showLintMessages && this.config.input.lints && this.config.input.lints.length > 0) {
            this.drawLintMessagesCard(ctx, cardX, cardY, cardWidth, cardHeight);
        }
    }

    private applyImageBorderRadius(ctx: CanvasRenderingContext2D, radius: number): void {
        // Create a clipping path for the entire image
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(this.width - radius, 0);
        ctx.quadraticCurveTo(this.width, 0, this.width, radius);
        ctx.lineTo(this.width, this.height - radius);
        ctx.quadraticCurveTo(this.width, this.height, this.width - radius, this.height);
        ctx.lineTo(radius, this.height);
        ctx.quadraticCurveTo(0, this.height, 0, this.height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
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

    private hexToRgba(hex: string, alpha: number): string {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private drawSplitLeftRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
        // Add a slight leftward slant (15 degrees)
        const slantOffset = height * 0.15; // 15% of height for slant

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width + slantOffset, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    private drawSplitRightRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
        // Add a slight leftward slant (15 degrees)
        const slantOffset = height * 0.15; // 15% of height for slant

        ctx.beginPath();
        ctx.moveTo(x - slantOffset, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x - slantOffset, y);
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

        const startNumber = this.config.styling.lineNumberStart ?? 1;

        for (let i = 0; i < lineCount; i++) {
            const lineY = y + i * this.lineHeight;
            ctx.fillText((startNumber + i).toString(), x, lineY);
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
        const controlY = cardY + 19;
        const startX = cardX + 20;
        const isOutlined = this.config.styling.windowControl === 'outlined';
        const controlSize = this.windowControlSize;

        // Center the window controls horizontally
        const totalControlWidth = 3 * controlSize + 2 * this.windowControlSpacing;
        const centerX = cardX + 20 + totalControlWidth / 2;
        const adjustedStartX = centerX - totalControlWidth / 2;

        // Close button (red)
        if (isOutlined) {
            ctx.strokeStyle = '#ff5f57';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(adjustedStartX, controlY, controlSize, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#ff5f57';
            ctx.beginPath();
            ctx.arc(adjustedStartX, controlY, controlSize, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Minimize button (yellow)
        if (isOutlined) {
            ctx.strokeStyle = '#ffbd2e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(adjustedStartX + controlSize + this.windowControlSpacing, controlY, controlSize, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#ffbd2e';
            ctx.beginPath();
            ctx.arc(adjustedStartX + controlSize + this.windowControlSpacing, controlY, controlSize, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Maximize button (green)
        if (isOutlined) {
            ctx.strokeStyle = '#28ca42';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(adjustedStartX + 2 * (controlSize + this.windowControlSpacing), controlY, controlSize, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#28ca42';
            ctx.beginPath();
            ctx.arc(adjustedStartX + 2 * (controlSize + this.windowControlSpacing), controlY, controlSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    private drawFileHeader(ctx: CanvasRenderingContext2D, cardX: number, cardY: number, cardWidth: number): void {
        const headerHeight = 40;
        const headerY = cardY + 10;

        // Calculate tab dimensions
        const iconSize = 16;
        const iconPadding = 8;
        const textPadding = 12;
        const tabPadding = 16;
        const plusPadding = 16; // Padding between tab and plus icon

        // Measure text width
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const textWidth = ctx.measureText(this.config.styling.fileName!).width;

        // Check if we have a custom icon
        const hasCustomIcon = this.config.styling.fileIcon && fs.existsSync(this.config.styling.fileIcon);

        // Calculate tab width (only include icon space if we have a custom icon)
        let tabWidth = textWidth + textPadding + tabPadding;
        if (hasCustomIcon) {
            tabWidth += iconSize + iconPadding;
        }

        const tabHeight = 32;

        // Calculate plus icon width and spacing
        const plusSize = 12;
        const totalTabWidth = tabWidth + plusPadding + plusSize;

        // Determine header position based on window controls
        let headerX: number;
        if (this.config.styling.windowControl !== 'hidden') {
            // Window controls are showing, position tab just to the right of controls
            const windowControlSpace = 80; // Space for window controls
            headerX = cardX + windowControlSpace + 10; // 10px spacing after window controls
        } else {
            // No window controls, position header to match top padding
            headerX = cardX + 10; // Match the top padding (10px from card edge)
        }

        // Draw tab background (more gray but still transparent)
        const tabBackgroundColor = 'rgba(60, 60, 60, 0.4)';
        ctx.fillStyle = tabBackgroundColor;
        this.drawRoundedRect(ctx, headerX, headerY, tabWidth, tabHeight, 8);
        ctx.fill();

        // Draw icon only if we have a custom icon
        let textX = headerX + tabPadding;
        if (hasCustomIcon) {
            this.drawCustomIcon(ctx, textX, headerY + (tabHeight - iconSize) / 2, iconSize);
            textX += iconSize + iconPadding;
        } else {
            // Center the text horizontally when no icon is present
            textX = headerX + (tabWidth - textWidth) / 2;
        }

        // Draw file name
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.styling.fileName!, textX, headerY + tabHeight / 2);

        // Draw plus icon with proper padding from the tab
        const plusX = headerX + tabWidth + plusPadding;
        this.drawPlusIcon(ctx, plusX, headerY + tabHeight / 2, plusSize);
    }

    private drawDartIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        // Draw a simplified Dart logo (blue and light blue geometric shape)
        // This is a simplified representation of the Dart logo

        // Main blue triangle
        ctx.fillStyle = '#00d4aa';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.5, y + size);
        ctx.closePath();
        ctx.fill();

        // Light blue accent
        ctx.fillStyle = '#66e6d1';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, y + size * 0.2);
        ctx.lineTo(x + size * 0.8, y + size * 0.2);
        ctx.lineTo(x + size * 0.5, y + size * 0.8);
        ctx.closePath();
        ctx.fill();
    }

    private drawCustomIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        try {
            const img = new Image();
            const imageBuffer = fs.readFileSync(this.config.styling.fileIcon!);
            img.src = imageBuffer;

            // Calculate aspect ratio to maintain proportions
            const aspectRatio = img.width / img.height;
            let drawWidth = size;
            let drawHeight = size;

            if (aspectRatio > 1) {
                // Image is wider than tall
                drawHeight = size / aspectRatio;
            } else if (aspectRatio < 1) {
                // Image is taller than wide
                drawWidth = size * aspectRatio;
            }

            // Center the image in the allocated space
            const offsetX = x + (size - drawWidth) / 2;
            const offsetY = y + (size - drawHeight) / 2;

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        } catch (error) {
            console.warn(`Failed to load custom icon: ${this.config.styling.fileIcon}. Using default icon.`);
            this.drawDartIcon(ctx, x, y, size);
        }
    }

    private drawPlusIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Draw horizontal line
        ctx.beginPath();
        ctx.moveTo(x - size * 0.5, y);
        ctx.lineTo(x + size * 0.5, y);
        ctx.stroke();

        // Draw vertical line
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.5);
        ctx.lineTo(x, y + size * 0.5);
        ctx.stroke();
    }

    private drawLints(ctx: CanvasRenderingContext2D, code: string, x: number, y: number, maxWidth: number): void {
        if (!this.config.input.lints) return;

        const lines = code.split('\n');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Calculate the offset for line numbers (original file line numbers vs displayed line numbers)
        const lineOffset = this.config.input.startLine - 1;

        for (const lint of this.config.input.lints) {
            // Set color based on lint type
            switch (lint.type) {
                case 'error':
                    ctx.strokeStyle = '#ff6b6b'; // Red
                    break;
                case 'warning':
                    ctx.strokeStyle = '#ffa726'; // Orange
                    break;
                case 'info':
                    ctx.strokeStyle = '#42a5f5'; // Blue
                    break;
                default:
                    ctx.strokeStyle = '#ff6b6b'; // Default to red
            }

            // Convert original file line numbers to displayed line numbers
            const startLineIndex = lint.start.line - lineOffset - 1;
            const endLineIndex = lint.end.line - lineOffset - 1;

            // Check if lint is within the displayed code range
            if (startLineIndex >= 0 && startLineIndex < lines.length) {
                const lineY = y + startLineIndex * this.lineHeight;

                if (startLineIndex === endLineIndex) {
                    // Single line lint
                    this.drawSingleLineLint(ctx, lines[startLineIndex], x, lineY, lint);
                } else {
                    // Multi-line lint
                    this.drawMultiLineLint(ctx, lines, x, y, lint, lineOffset);
                }


            }
        }
    }

    private drawSingleLineLint(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, lint: any): void {
        // Calculate character positions
        const startChar = Math.max(0, lint.start.char - 1);
        const endChar = Math.min(line.length, lint.end.char);

        if (startChar >= endChar) return;

        // Measure text up to start and end positions
        ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
        const textBeforeStart = line.substring(0, startChar);
        const textBeforeEnd = line.substring(0, endChar);

        const startX = x + ctx.measureText(textBeforeStart).width;
        const endX = x + ctx.measureText(textBeforeEnd).width;

        // Draw wavy underline
        this.drawWavyLine(ctx, startX, y + this.lineHeight - 2, endX - startX);
    }

    private drawMultiLineLint(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lint: any, lineOffset: number): void {
        const startLineIndex = lint.start.line - lineOffset - 1;
        const endLineIndex = lint.end.line - lineOffset - 1;

        // Draw start of lint on first line
        if (startLineIndex >= 0 && startLineIndex < lines.length) {
            const lineY = y + startLineIndex * this.lineHeight;
            const startChar = Math.max(0, lint.start.char - 1);
            const line = lines[startLineIndex];

            ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
            const textBeforeStart = line.substring(0, startChar);
            const startX = x + ctx.measureText(textBeforeStart).width;

            // Draw wavy line from start position to end of line
            this.drawWavyLine(ctx, startX, lineY + this.lineHeight - 2, x + ctx.measureText(line).width - startX);
        }

        // Draw full lines in between
        for (let i = startLineIndex + 1; i < endLineIndex; i++) {
            if (i >= 0 && i < lines.length) {
                const lineY = y + i * this.lineHeight;
                const line = lines[i];

                ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
                const lineWidth = ctx.measureText(line).width;

                this.drawWavyLine(ctx, x, lineY + this.lineHeight - 2, lineWidth);
            }
        }

        // Draw end of lint on last line
        if (endLineIndex >= 0 && endLineIndex < lines.length) {
            const lineY = y + endLineIndex * this.lineHeight;
            const endChar = Math.min(lines[endLineIndex].length, lint.end.char);
            const line = lines[endLineIndex];

            ctx.font = `${this.fontSize}px 'Monaco', 'Menlo', 'Ubuntu Mono', monospace`;
            const textBeforeEnd = line.substring(0, endChar);
            const endX = x + ctx.measureText(textBeforeEnd).width;

            // Draw wavy line from start of line to end position
            this.drawWavyLine(ctx, x, lineY + this.lineHeight - 2, endX - x);
        }
    }

    private drawWavyLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
        const waveHeight = 2;
        const waveLength = 4;
        const segments = Math.ceil(width / waveLength);

        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let i = 0; i < segments; i++) {
            const segmentX = x + i * waveLength;
            const nextX = Math.min(x + (i + 1) * waveLength, x + width);
            const midX = (segmentX + nextX) / 2;
            const direction = i % 2 === 0 ? 1 : -1;

            ctx.quadraticCurveTo(midX, y + direction * waveHeight, nextX, y);
        }

        ctx.stroke();
    }

    private drawLintMessagesCard(ctx: CanvasRenderingContext2D, cardX: number, cardY: number, cardWidth: number, cardHeight: number): void {
        if (!this.config.input.lints) return;

        // Filter lints that have messages
        const lintsWithMessages = this.config.input.lints.filter(lint => lint.message);
        if (lintsWithMessages.length === 0) return;

        // Calculate the gap between cards (24 pixels)
        const gap = 24;

        // Calculate lint messages card position and dimensions
        const lintCardX = cardX;
        const lintCardY = cardY + cardHeight + gap;
        const lintCardWidth = cardWidth;

        // Calculate content dimensions
        const lineHeight = 20;
        const itemSpacing = 8;
        const contentHeight = lintsWithMessages.length * (lineHeight + itemSpacing) - itemSpacing;
        const lintCardHeight = contentHeight + 2 * this.cardPadding;

        // Draw lint messages card background
        const cardBackground = this.config.styling.cardBackground;
        const transparency = cardBackground?.transparency ?? 0.8; // Default to 0.8 if not specified
        ctx.fillStyle = `rgba(30, 30, 30, ${transparency})`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        // Rounded rectangle for lint card
        const borderRadius = this.config.styling.borderRadius ?? 15;
        this.drawRoundedRect(ctx, lintCardX, lintCardY, lintCardWidth, lintCardHeight, borderRadius);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw lint messages
        const contentX = lintCardX + this.cardPadding;
        const contentY = lintCardY + this.cardPadding;

        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textBaseline = 'top';

        for (let i = 0; i < lintsWithMessages.length; i++) {
            const lint = lintsWithMessages[i];
            const messageY = contentY + i * (lineHeight + itemSpacing);

            // Draw lint type indicator
            const indicatorSize = 8;
            const indicatorX = contentX;
            const indicatorY = messageY + lineHeight / 2; // Center vertically with the text

            // Set color based on lint type
            let indicatorColor: string;
            let textColor: string;

            switch (lint.type) {
                case 'error':
                    indicatorColor = '#ef4444'; // Red
                    textColor = '#fca5a5';
                    break;
                case 'warning':
                    indicatorColor = '#f59e0b'; // Orange
                    textColor = '#fcd34d';
                    break;
                case 'info':
                    indicatorColor = '#3b82f6'; // Blue
                    textColor = '#93c5fd';
                    break;
                default:
                    indicatorColor = '#ef4444';
                    textColor = '#fca5a5';
            }

            // Draw indicator circle
            ctx.fillStyle = indicatorColor;
            ctx.beginPath();
            ctx.arc(indicatorX + indicatorSize / 2, indicatorY, indicatorSize / 2, 0, 2 * Math.PI);
            ctx.fill();

            // Draw message text - align with the center of the indicator
            ctx.fillStyle = textColor;
            ctx.textBaseline = 'middle'; // Center text vertically
            ctx.fillText(lint.message!, indicatorX + indicatorSize + 8, indicatorY);
        }
    }
} 
