"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCommands = void 0;
const project_1 = require("../lib/project");
const core_1 = require("../lib/core");
const epic_geo_1 = require("epic-geo");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.ProjectCommands = [
    {
        name: "init",
        description: "Initialize an Epic project.",
        alias: ["--init"],
        params: [
            {
                type: "input",
                name: "name",
                description: "Name of the project.",
                alias: ["--name", "-n"],
                message: "Please provide a project name:",
                validator: (value) => {
                    if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value))
                        throw new Error("Please provide a valid lowercase project name!");
                },
                default: () => path_1.default.basename(path_1.default.resolve()),
            },
            {
                type: "input",
                name: "description",
                description: "Description for the project.",
                alias: ["--description", "-d"],
                message: "Please provide a project description:",
            },
            {
                type: "input",
                name: "brandName",
                description: "Name of the Brand for the project.",
                alias: ["--brand-name", "-bn"],
                message: "Please provide a brand name:",
                default: () => "N/A",
            },
            {
                type: "list",
                name: "brandCountry",
                description: "Country of the project Brand.",
                alias: ["--brand-country", "-bc"],
                message: "Please provide your country:",
                choices: new epic_geo_1.EpicGeo().countryList(),
            },
            {
                type: "input",
                name: "brandAddress",
                description: "Address of the project Brand.",
                alias: ["--brand-address", "-ba"],
                message: "Please provide your address:",
                default: () => "N/A",
            },
        ],
        default: {
            name: path_1.default.basename(path_1.default.resolve()),
            description: "N/A",
            brandName: "N/A",
            brandCountry: "N/A",
            brandAddress: "N/A",
        },
        method: core_1.Core.initialize,
    },
    {
        name: "create-project",
        description: "Create a new Epic project quickly.",
        method: project_1.Project.create,
    },
    {
        name: "create-controller",
        description: "Create a new controller in your Epic project.",
        params: [
            {
                type: "input",
                name: "name",
                description: "Name of the controller.",
                alias: ["--name", "-n"],
                message: "Please provide a controller name:",
                validator: (value) => {
                    if (!/^[A-Z]\w+$/.test(value))
                        throw new Error(`Please provide a valid controller name!`);
                },
            },
            {
                type: "input",
                name: "description",
                description: "Description for the controller.",
                alias: ["--description", "-d"],
                message: "Please provide a controller description:",
                default: () => "N/A",
            },
            {
                type: "input",
                name: "prefix",
                description: "Prefix of the controller.",
                alias: ["--prefix", "-p"],
                message: "Please provide a controller prefix:",
                default: (options) => `/${options.name.toLowerCase()}/`,
            },
            {
                type: "input",
                name: "sampleDir",
                description: "Controller samples container directory.",
                alias: ["--sampleDir", "-sd"],
                optional: true,
            },
            {
                type: "list",
                name: "template",
                description: "Template of the Controller",
                alias: ["--template", "-T"],
                message: "Please provide a controller template:",
                choices: (options) => {
                    // Controller Path
                    const ControllerDir = options.sampleDir ||
                        path_1.default.join(project_1.Project.SamplesPath, "./controller/");
                    // Resolve Directory
                    fs_1.default.mkdirSync(ControllerDir, { recursive: true });
                    // Samples List
                    const List = fs_1.default.readdirSync(ControllerDir)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                    return [...(List.length ? List : ["default"])];
                },
            },
            {
                type: "list",
                name: "parent",
                description: "Controller parent name.",
                alias: ["--parent", "-pr"],
                message: "Please provide the name of parent controller:",
                choices: () => {
                    // Resolve Directory
                    fs_1.default.mkdirSync(project_1.Project.ControllersPath, { recursive: true });
                    // Parents List
                    const List = fs_1.default.readdirSync(project_1.Project.ControllersPath)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                    return [...(List.length ? List : ["index"])];
                },
            },
        ],
        method: project_1.Project.createController,
    },
];
