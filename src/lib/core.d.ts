export interface ConfigurationInterface {
    version: number;
    paths: PathsInterface;
    application?: ApplicationInterface;
    transactions: Array<TransactionInterface>;
}
export interface PathsInterface {
    samples: string;
    contollers: string;
    schemas: string;
}
export interface ApplicationInterface {
    name: string;
    description: string;
    brand: BrandInterface;
}
export interface BrandInterface {
    name: string;
    country: string;
    address: string;
}
export interface TransactionInterface {
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
    static ConfigFileName: string;
    static ConfigFilePath: () => string;
    static DefaultConfig: ConfigurationInterface;
    static SupportedConfigVersions: number[];
    static initialize: (options: InitializationOptions) => Promise<void>;
    static install: () => Promise<void>;
    static getConfiguration: (strict?: boolean) => ConfigurationInterface | null;
    static setConfiguration: (data: ConfigurationInterface) => void;
    static removeConfiguration: () => void;
}
