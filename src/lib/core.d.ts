import { EpicConfigManager } from "@saffellikhan/epic-config-manager";
export declare type FrameworkType = "Express";
export declare type ProjectType = "Application" | "Plugin";
export interface ConfigurationInterface {
    version: number;
    framework: FrameworkType;
    type: ProjectType;
    name: string;
    description: string;
    brand: BrandInterface;
    paths?: PathsInterface;
    lastAccess?: AccessInterface;
}
export interface AccessInterface {
    controller?: string;
    schema?: string;
    middleware?: string;
}
export interface PathsInterface {
    templates?: string;
    contollers?: string;
    schemas?: string;
    middlewares?: string;
}
export interface BrandInterface {
    name: string;
    country: string;
    address: string;
}
export interface TransactionsInterface {
    version: number;
    transactions: Array<TransactionInterface>;
}
export interface TransactionInterface {
    command: string;
    params: Record<string, any>;
}
export declare const ConfigManager: EpicConfigManager<Required<{
    main: ConfigurationInterface;
    transactions: TransactionsInterface;
}>>;
export declare class Core {
    static install(): Promise<void>;
}
