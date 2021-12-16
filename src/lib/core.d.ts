import Execa from "execa";
import { EpicConfigManager } from "@saffellikhan/epic-config-manager";
export declare type FrameworkType = "Express";
export declare type ProjectType = "Application" | "Plugin";
export declare type ResourceType = "controller" | "model" | "middleware";
export declare type PackageManagerType = "npm" | "yarn";
export interface DatabaseConnectionDetails {
    host: string;
    port: number;
    user: string;
    password: string;
    dbname: string;
    limit?: number;
}
export interface OtherOptions {
    postman?: {
        apiKey: string;
        collectionId: string;
        disabled?: boolean;
    };
    [Key: string]: any;
}
export interface ConfigurationInterface {
    version: number;
    framework: FrameworkType;
    type: ProjectType;
    packageManager: PackageManagerType;
    name: string;
    description: string;
    brand: BrandInterface;
    database: DatabaseConnectionDetails;
    plugins: Record<string, string>;
    paths: PathsInterface;
    other: OtherOptions;
}
export interface PathsInterface {
    templates?: string;
    contollers?: string;
    models?: string;
    middlewares?: string;
}
export interface BrandInterface {
    name: string;
    country: string;
    address: string;
}
export interface TransactionsInterface {
    version: number;
    lastAccess: AccessInterface;
    transactions: Array<TransactionInterface>;
}
export declare type AccessInterface = {
    [key in ResourceType]?: string;
};
export interface TransactionInterface {
    command: string;
    params: Record<string, any>;
}
export interface ResourcesInterface {
    version: number;
    resources: Array<ResourceInterface>;
}
export interface ResourceInterface {
    type: ResourceType;
    name: string;
    parent?: string;
}
export declare const ConfigManager: EpicConfigManager<Required<{
    main: ConfigurationInterface;
    transactions: TransactionsInterface;
    resources: ResourcesInterface;
}>>;
export declare class Core {
    static install(): Promise<void>;
    static update(): Promise<Execa.ExecaReturnValue<string>>;
}
