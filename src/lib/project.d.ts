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
export interface CreateSchemaColumnOptions {
    schema: string;
    type: "String" | "Number" | "Boolean" | "Enum" | "Record" | "Array" | "Relation" | "Any";
    choices?: string[];
    arrayof?: "String" | "Number" | "Boolean" | "Record" | "Relation" | "Any";
    recordType?: string;
    length?: number;
    relation?: string;
    mapping?: string[];
    name: string;
    nullable?: boolean;
    defaultValue?: string;
    collation?: string;
    index?: ("FULLTEXT" | "UNIQUE" | "INDEX" | "SPATIAL")[];
    onUpdate?: string;
}
export interface DeleteSchemaColumnOptions {
    schema: string;
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
    static createModule(options: CreateControllerOptions, command: CommandInterface): Promise<void>;
    static deleteModule(options: DeleteControllerOptions): Promise<void>;
    static createSchemaColumn(options: CreateSchemaColumnOptions, command: CommandInterface): Promise<void>;
    static deleteSchemaColumn: (options: DeleteSchemaColumnOptions) => Promise<void>;
    static createMiddleware: (options: CreateMiddlewareOptions, command: CommandInterface) => Promise<void>;
    static deleteMiddleware(options: DeleteMiddlewareOptions): Promise<void>;
    static addPlugin(options: AddPluginOptions, command: CommandInterface): Promise<void>;
    static linkPlugin(options: AddPluginOptions): Promise<void>;
    static removePlugin(options: RemovePluginOptions, command: CommandInterface): Promise<void>;
    static unlinkPlugin(options: RemovePluginOptions): Promise<void>;
}
