import { CommandInterface } from "@saffellikhan/epic-cli-builder";
export interface CreateControllerOptions {
    name: string;
    description: string;
    prefix: string;
    template: string;
    parent: string;
    sampleDir?: string;
}
export declare class Project {
    static PackagePath: string;
    static SamplesPath: string;
    static EnvironmentsPath: string;
    static ControllersPath: string;
    static SchemasPath: string;
    static getPackage: () => any;
    static create: () => Promise<boolean>;
    static createController: (options: CreateControllerOptions, command: CommandInterface) => Promise<void>;
}
