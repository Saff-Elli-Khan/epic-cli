export interface CreateOptions {
    name: string;
    description: string;
    brandName: string;
    brandCountry: string;
    brandAddress: string;
}
export interface CreateControllerOptions {
    name: string;
    description: string;
    version: number;
    type: "Core" | "Custom";
    scope: "Parent" | "Child";
}
export declare class Project {
    static PackagePath: string;
    static Package: () => any;
    static create: (options: CreateOptions) => Promise<boolean>;
    static createController: (options: CreateControllerOptions) => Promise<void>;
}
