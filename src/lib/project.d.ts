export interface CreateOptions {
    name: string;
    description: string;
    brandName: string;
    brandCountry: string;
    brandAddress: string;
}
export declare class Project {
    static create: (options: CreateOptions) => Promise<boolean>;
}
