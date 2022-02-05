export declare const generateRandomKey: (length: number) => string;
export declare const copyFileSync: (source: string, target: string, options?: {
    subFileToFile?: boolean | undefined;
    fileEditor?: ((content: string) => string) | undefined;
} | undefined) => void;
export declare const copyFolderRecursiveSync: (source: string, target: string, options?: {
    copySubDir?: boolean | undefined;
    subFileToFile?: boolean | undefined;
    fileEditor?: ((content: string) => string) | undefined;
} | undefined) => void;
export declare const removeFolderRecursiveSync: (path: string) => void;
