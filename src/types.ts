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
        cardTransparency: number;
        background: {
            type: 'filled' | 'transparent' | 'gradient';
            color?: string; // For 'filled' type
            colors?: Array<{
                color: string;
                stop: number; // 0.0 to 1.0
            }>; // For 'gradient' type
        };
        showLineNumbers: boolean;
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
    };
} 
