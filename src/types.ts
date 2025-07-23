export interface LintPosition {
    line: number;
    char: number;
}

export interface Lint {
    start: LintPosition;
    end: LintPosition;
    type: 'warning' | 'info' | 'error';
    message?: string;
}

export interface SnapshotConfig {
    input: {
        file: string;
        startLine: number;
        endLine: number;
        lints?: Lint[];
    };
    output: {
        path: string;
        width?: number | null;
        height?: number | null;
    };
    styling: {
        cardBackground?: {
            type: 'solid' | 'layered';
            transparency: number; // Card transparency level (0.0 = fully transparent, 1.0 = fully opaque)
            partialTransparency?: number; // For 'layered' type - transparency level for the overlay color (0.0-1.0)
            showBlur?: boolean; // For 'layered' type - whether to show blur effect on the slanted edge
            color?: string; // For 'solid' type or 'layered' type - main overlay color
            partialBackgroundColor?: string; // For 'layered' type - full background color
        };
        background: {
            type: 'filled' | 'transparent' | 'gradient';
            color?: string; // For 'filled' type
            colors?: Array<{
                color: string;
                stop: number; // 0.0 to 1.0
            }>; // For 'gradient' type
            direction?: 'to-bottom' | 'to-top' | 'to-right' | 'to-left' | 'to-bottom-right' | 'to-bottom-left' | 'to-top-right' | 'to-top-left'; // For 'gradient' type
        };
        showLineNumbers: boolean;
        lineNumberStart?: number; // Starting line number (defaults to 1)
        showLintMessages?: boolean; // New option to control lint message display
        fileName?: string | null;
        fileIcon?: string | null;
        windowControl: 'filled' | 'outlined' | 'hidden';
        cardMargin?: {
            horizontal?: number;
            vertical?: number;
        };
        borderRadius?: number;
        imageBorderRadius?: number;
        tokenColors?: {
            keyword?: string; // Purple by default
            function?: string; // Yellow by default
            method?: string; // Yellow by default
            string?: string; // Green by default
            number?: string; // Orange by default
            comment?: string; // Gray by default
            'class-name'?: string; // Blue by default
            variable?: string; // Light blue by default
            operator?: string; // White by default
            punctuation?: string; // White by default
        };
    };
} 
