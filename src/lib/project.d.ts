import { CommandInterface } from "@saffellikhan/epic-cli-builder";
export interface CreateOptions {
    name: string;
    description: string;
    brandName: string;
    brandCountry: string;
    brandAddress: string;
}
export interface CreateControllerOptions {
    name: string;
    description: string;
    version: number;
    prefix: string;
    type: "Core" | "Custom";
    scope: "Parent" | "Child";
    template: string;
}
export declare class Project {
    static PackagePath: string;
    static SamplesPath: string;
    static getPackage: () => any;
    static create: (options: CreateOptions) => Promise<boolean>;
    static createController: (options: CreateControllerOptions, command: CommandInterface) => Promise<void>;
}
