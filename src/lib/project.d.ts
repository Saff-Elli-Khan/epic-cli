import { ProjectType, ConfigurationInterface } from "./core";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
export interface InitializationOptions {
    type: ProjectType;
    name: string;
    description: string;
    brandName: string;
    brandCountry: string;
    brandAddress: string;
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
export interface CreateSchemaOptions {
    name: string;
    description: string;
    template: string;
    templateDir?: string;
}
export interface DeleteSchemaOptions {
    name: string;
}
export declare class Project {
    static PackagePath(): string;
    static EnvironmentsPath(): string;
    static AppPath(): string;
    static SamplesPath(): string;
    static ControllersPath(): string;
    static SchemasPath(): string;
    static MiddlewaresPath(): string;
    static getPackage(): any;
    static configure(Configuration: ConfigurationInterface): void;
    static initialize(options: InitializationOptions): Promise<void>;
    static create(): Promise<void>;
    static createController(options: CreateControllerOptions, command: CommandInterface): Promise<void>;
    static deleteController: (options: DeleteControllerOptions) => Promise<void>;
    static createSchema(options: CreateSchemaOptions, command: CommandInterface): Promise<void>;
    static deleteSchema(options: DeleteSchemaOptions): Promise<void>;
}
