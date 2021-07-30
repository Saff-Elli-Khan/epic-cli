import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { ConfigurationInterface } from "./core";
export interface CreateControllerOptions {
    name: string;
    description: string;
    prefix: string;
    template: string;
    parent: string;
    sampleDir?: string;
}
export interface DeleteControllerOptions {
    name: string;
}
export interface CreateSchemaOptions {
    name: string;
    description: string;
    template: string;
    sampleDir?: string;
}
export declare class Project {
    static PackagePath: string;
    static EnvironmentsPath: string;
    static AppPath: string;
    static SamplesPath: string;
    static ControllersPath: string;
    static SchemasPath: string;
    static getPackage: () => any;
    static configure: (Configuration: ConfigurationInterface) => void;
    static create: () => Promise<boolean>;
    static createController: (options: CreateControllerOptions, command: CommandInterface) => Promise<void>;
    static deleteController: (options: DeleteControllerOptions) => Promise<void>;
    static createSchema: (options: CreateSchemaOptions, command: CommandInterface) => Promise<void>;
}
