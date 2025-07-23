export interface SnapshotConfig {
    input: {
        file: string;
        startLine: number;
        endLine: number;
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
        showFileName: boolean;
        windowControl: 'filled' | 'outlined' | 'hidden';
        cardMargin?: {
            horizontal?: number;
            vertical?: number;
        };
        borderRadius?: number;
        imageBorderRadius?: number;
    };
} 
