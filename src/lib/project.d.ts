import { CommandInterface } from "@saffellikhan/epic-cli-builder";
export interface CreateControllerOptions {
    name: string;
    description: string;
    version: number;
    prefix: string;
    scope: "Parent" | "Child";
    template: string;
    parent: string;
    sampleDir?: string;
}
export declare class Project {
    static PackagePath: string;
    static SamplesPath: string;
    static getPackage: () => any;
    static create: () => Promise<boolean>;
    static createController: (options: CreateControllerOptions, command: CommandInterface) => Promise<void>;
}
