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
        showWindowControls: boolean;
        backgroundColor: string;
        gradientMiddleColor: string;
        showLineNumbers: boolean;
        showFileName: boolean;
        windowControlStyle: 'filled' | 'outlined';
    };
} 
