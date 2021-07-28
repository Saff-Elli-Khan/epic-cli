export interface Configuration {
    version: number;
    application?: Application;
    transactions: Array<Transaction>;
}
export interface Application {
    name: string;
    description: string;
    brand: Brand;
}
export interface Brand {
    name: string;
    country: string;
    address: string;
}
export interface Transaction {
    command: string;
    params: Record<string, any>;
}
export interface InitializationOptions {
    name: string;
    description: string;
    brandName: string;
    brandCountry: string;
    brandAddress: string;
}
export declare class Core {
    static RootPath: string;
    static AppPath: string;
    static DefaultConfig: Configuration;
    static SupportedConfigVersions: number[];
    static initialize: (options: InitializationOptions) => void;
    static getConfiguration: (strict?: boolean) => Configuration | null;
    static setConfiguration: (data: Configuration) => void;
}
