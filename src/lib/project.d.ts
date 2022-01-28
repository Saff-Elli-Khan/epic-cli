import { ProjectType, ConfigurationInterface } from "./core";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { DatabaseEngine } from "..";
export interface InitializationOptions {
    type: ProjectType;
    dbEngine: DatabaseEngine;
    name: string;
    description: string;
    brandName: string;
    brandCountry: string;
    brandAddress: string;
}
export interface CreateOptions {
    admin: boolean;
    installation: boolean;
    yarn: boolean;
}
export interface CreateControllerOptions {
    name: string;
    description: string;
    prefix: string;
    template: string;
    parent: string;
    templateDir?: string;
}
export interface DeleteControllerOptions {
    name: string;
}
export interface CreateModelOptions {
    name: string;
    description: string;
    template: string;
    templateDir?: string;
}
export interface DeleteModelOptions {
    name: string;
}
export interface CreateMiddlewareOptions {
    name: string;
    description: string;
    template: string;
    templateDir?: string;
}
export interface DeleteMiddlewareOptions {
    name: string;
}
export interface CreateJobOptions {
    name: string;
    description: string;
    template: string;
    templateDir?: string;
}
export interface DeleteJobOptions {
    name: string;
}
export interface AddPluginOptions {
    name: string;
}
export interface RemovePluginOptions {
    name: string;
}
export declare class Project {
    static PackagePath(): string;
    static EnvironmentsPath(): string;
    static AppPath(): string;
    static AppCore(): string;
    static SamplesPath(): string;
    static ControllersPath(): string;
    static ModelsPath(): string;
    static MiddlewaresPath(): string;
    static JobsPath(): string;
    static getPackage(silent?: boolean): any;
    static getAdminDashboardPathName(): string;
    static configure(Configuration: ConfigurationInterface): void;
    static initialize(options: InitializationOptions): Promise<void>;
    static create(options: CreateOptions): Promise<void>;
    static createController(options: CreateControllerOptions, command: CommandInterface): Promise<void>;
    static deleteController: (options: DeleteControllerOptions) => Promise<void>;
    static createModel(options: CreateModelOptions, command: CommandInterface): Promise<void>;
    static deleteModel(options: DeleteModelOptions): Promise<void>;
    static createModule(options: CreateControllerOptions, command: CommandInterface): Promise<void>;
    static deleteModule(options: DeleteControllerOptions): Promise<void>;
    static createMiddleware: (options: CreateMiddlewareOptions, command: CommandInterface) => Promise<void>;
    static deleteMiddleware(options: DeleteMiddlewareOptions): Promise<void>;
    static createJob(options: CreateJobOptions, command: CommandInterface): Promise<void>;
    static deleteJob(options: DeleteJobOptions): Promise<void>;
    static addPlugin(options: AddPluginOptions, command: CommandInterface): Promise<void>;
    static linkPlugin(options: AddPluginOptions): Promise<void>;
    static linkPlugins(): Promise<void>;
    static updatePlugin(options: AddPluginOptions): Promise<void>;
    static removePlugin(options: RemovePluginOptions, command: CommandInterface): Promise<void>;
    static unlinkPlugin(options: RemovePluginOptions): Promise<void>;
    static build(): Promise<void>;
}
