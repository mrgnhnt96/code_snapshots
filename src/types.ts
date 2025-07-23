export interface SnapshotConfig {
    input: {
        file: string;
        startLine: number;
        endLine: number;
    };
    output: {
        path: string;
        width: number;
        height: number;
    };
    styling: {
        cardTransparency: number;
        backgroundColor: string;
        gradientMiddleColor: string;
        showLineNumbers: boolean;
        showFileName: boolean;
        windowControl: 'filled' | 'outlined' | 'hidden';
    };
} 
