"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCommands = void 0;
const epic_config_manager_1 = require("@saffellikhan/epic-config-manager");
const project_1 = require("../lib/project");
const core_1 = require("../lib/core");
const epic_geo_1 = require("epic-geo");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create Controller Parameters
const CreateControllerParams = [
    {
        type: "input",
        name: "name",
        description: "Name of the controller.",
        alias: ["--name", "-n"],
        message: "Please provide a controller name:",
        validator: (value) => {
            if (value === "None")
                throw new Error(`Controller name 'None' is not allowed!`);
            else if (!/^[A-Z]\w+$/.test(value))
                throw new Error(`Please provide a valid controller name!`);
        },
    },
    {
        type: "input",
        name: "description",
        description: "Description for the controller.",
        alias: ["--description", "-d"],
        message: "Please provide a controller description:",
        default: "N/A",
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
        name: "templateDir",
        description: "Controller templates container directory.",
        alias: ["--templateDir", "-td"],
        skip: true,
    },
    {
        type: "list",
        name: "template",
        description: "Template of the Controller",
        message: "Please select a controller template:",
        choices: (options) => {
            // Controller Path
            const ControllerDir = options.templateDir ||
                path_1.default.join(core_1.ConfigManager.getConfig("main").paths.templates, "./controller/");
            // Resolve Directory
            fs_1.default.mkdirSync(ControllerDir, { recursive: true });
            // Templates List
            return fs_1.default.readdirSync(ControllerDir)
                .filter((file) => /\.ts$/g.test(file))
                .map((file) => file.replace(/\.\w*/g, ""));
        },
    },
    {
        type: "list",
        name: "parent",
        description: "Controller parent name.",
        message: "Please provide the name of parent controller:",
        choices: () => {
            // Resolve Directory
            fs_1.default.mkdirSync(core_1.ConfigManager.getConfig("main").paths.contollers, {
                recursive: true,
            });
            // Controllers List
            return [
                "None",
                ...fs_1.default.readdirSync(core_1.ConfigManager.getConfig("main").paths.contollers)
                    .filter((file) => /\.ts$/g.test(file))
                    .map((file) => file.replace(/\.\w*/g, "")),
            ];
        },
    },
];
// Delete Controller Params
const DeleteControllerParams = [
    {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the controller.",
        message: "Please provide a controller name:",
        choices: () => {
            const ControllersPath = core_1.ConfigManager.getConfig("main").paths.contollers;
            // Resolve Directory
            fs_1.default.mkdirSync(ControllersPath, {
                recursive: true,
            });
            // Controllers List
            return fs_1.default.readdirSync(ControllersPath)
                .filter((file) => /\.ts$/g.test(file))
                .map((file) => file.replace(/\.\w*/g, ""));
        },
    },
];
// Create Project CLI Commands List
exports.ProjectCommands = [
    {
        name: "init",
        description: "Initialize Or Configure an Epic project.",
        alias: ["--init", "--configure"],
        params: [
            {
                type: "list",
                name: "type",
                description: "Type of the project.",
                alias: ["--type", "-t"],
                message: "Please provide a project type:",
                choices: ["application", "plugin"],
                default: "application",
            },
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
                default: () => {
                    var _a;
                    return ((_a = core_1.ConfigManager.getConfig("main", epic_config_manager_1.StrictLevel.NORMAL)) === null || _a === void 0 ? void 0 : _a.name) ||
                        path_1.default.basename(path_1.default.resolve());
                },
            },
            {
                type: "input",
                name: "description",
                description: "Description for the project.",
                alias: ["--description", "-d"],
                message: "Please provide a project description:",
                default: () => { var _a; return ((_a = core_1.ConfigManager.getConfig("main")) === null || _a === void 0 ? void 0 : _a.description) || "N/A"; },
            },
            {
                type: "input",
                name: "brandName",
                description: "Name of the Brand for the project.",
                alias: ["--brand-name", "-bn"],
                message: "Please provide a brand name:",
                default: () => { var _a, _b; return ((_b = (_a = core_1.ConfigManager.getConfig("main")) === null || _a === void 0 ? void 0 : _a.brand) === null || _b === void 0 ? void 0 : _b.name) || "N/A"; },
            },
            {
                type: "list",
                name: "brandCountry",
                description: "Country of the project Brand.",
                alias: ["--brand-country", "-bc"],
                message: "Please provide your country:",
                choices: new epic_geo_1.EpicGeo().countryList(),
                default: () => { var _a, _b; return ((_b = (_a = core_1.ConfigManager.getConfig("main")) === null || _a === void 0 ? void 0 : _a.brand) === null || _b === void 0 ? void 0 : _b.country) || "N/A"; },
            },
            {
                type: "input",
                name: "brandAddress",
                description: "Address of the project Brand.",
                alias: ["--brand-address", "-ba"],
                message: "Please provide your address:",
                default: () => { var _a, _b; return ((_b = (_a = core_1.ConfigManager.getConfig("main")) === null || _a === void 0 ? void 0 : _a.brand) === null || _b === void 0 ? void 0 : _b.address) || "N/A"; },
            },
        ],
        default: {
            type: "Application",
            name: path_1.default.basename(path_1.default.resolve()),
            description: "N/A",
            brandName: "N/A",
            brandCountry: "N/A",
            brandAddress: "N/A",
        },
        method: project_1.Project.initialize,
    },
    {
        name: "create",
        description: "Create a new Epic project.",
        params: [
            {
                type: "confirm",
                name: "admin",
                description: "Add an Admin Dashboard to the project.",
                alias: ["--admin"],
                default: false,
            },
            {
                type: "confirm",
                name: "installation",
                description: "Install dependencies automatically.",
                alias: ["-i"],
                message: "Do you want to install dependencies automatically?",
            },
            {
                type: "confirm",
                name: "yarn",
                description: "Install dependencies with Yarn.",
                alias: ["--yarn"],
                default: false,
            },
        ],
        method: project_1.Project.create,
    },
    {
        name: "create-controller",
        description: "Create a new controller in your Epic project.",
        params: CreateControllerParams,
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.createController,
    },
    {
        name: "delete-controller",
        description: "Remove controller from project.",
        params: DeleteControllerParams,
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.deleteController,
    },
    {
        name: "create-model",
        description: "Create a database model.",
        params: [
            {
                type: "input",
                name: "name",
                description: "Name of the model.",
                alias: ["--name", "-n"],
                message: "Please provide a model name:",
                validator: (value) => {
                    if (!/^[A-Z]\w+$/.test(value))
                        throw new Error(`Please provide a valid model name!`);
                },
            },
            {
                type: "input",
                name: "description",
                description: "Description for the model.",
                alias: ["--description", "-d"],
                message: "Please provide a model description:",
                default: "N/A",
            },
            {
                type: "input",
                name: "templateDir",
                description: "Model templates container directory.",
                alias: ["--templateDir", "-td"],
                skip: true,
            },
            {
                type: "list",
                name: "template",
                description: "Template of the Model",
                message: "Please provide a model template:",
                choices: (options) => {
                    // Model Path
                    const ModelDir = options.templateDir ||
                        path_1.default.join(core_1.ConfigManager.getConfig("main").paths.templates, "./model/");
                    // Resolve Directory
                    fs_1.default.mkdirSync(ModelDir, { recursive: true });
                    // Templates List
                    return fs_1.default.readdirSync(ModelDir)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.createModel,
    },
    {
        name: "delete-model",
        description: "Remove model from project.",
        params: [
            {
                type: "list",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the model.",
                message: "Please provide a model name:",
                choices: () => {
                    const ModelsPath = core_1.ConfigManager.getConfig("main").paths.models;
                    // Resolve Directory
                    fs_1.default.mkdirSync(ModelsPath, { recursive: true });
                    // Models List
                    return fs_1.default.readdirSync(ModelsPath)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.deleteModel,
    },
    {
        name: "create-module",
        description: "Create a new module.",
        params: CreateControllerParams,
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.createModule,
    },
    {
        name: "delete-module",
        description: "Delete module from project.",
        params: DeleteControllerParams,
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.deleteModule,
    },
    {
        name: "create-middleware",
        description: "Create a new middleware.",
        params: [
            {
                type: "input",
                name: "name",
                description: "Name of the middleware.",
                alias: ["--name", "-n"],
                message: "Please provide a middleware name:",
                validator: (value) => {
                    if (!/^[A-Z]\w+$/.test(value))
                        throw new Error(`Please provide a valid middleware name!`);
                },
            },
            {
                type: "input",
                name: "description",
                description: "Description for the middleware.",
                alias: ["--description", "-d"],
                message: "Please provide a middleware description:",
                default: "N/A",
            },
            {
                type: "input",
                name: "templateDir",
                description: "Middleware templates container directory.",
                alias: ["--templateDir", "-td"],
                skip: true,
            },
            {
                type: "list",
                name: "template",
                description: "Template of the Middleware",
                message: "Please provide a middleware template:",
                choices: (options) => {
                    // Middleware Path
                    const MiddlewareDir = options.templateDir ||
                        path_1.default.join(core_1.ConfigManager.getConfig("main").paths.templates, "./middleware/");
                    // Resolve Directory
                    fs_1.default.mkdirSync(MiddlewareDir, { recursive: true });
                    // Templates List
                    return fs_1.default.readdirSync(MiddlewareDir)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.createMiddleware,
    },
    {
        name: "delete-middleware",
        description: "Remove middleware from project.",
        params: [
            {
                type: "list",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the middleware.",
                message: "Please provide a middleware name:",
                choices: () => {
                    const MiddlewaresPath = core_1.ConfigManager.getConfig("main").paths.middlewares;
                    // Resolve Directory
                    fs_1.default.mkdirSync(MiddlewaresPath, { recursive: true });
                    // Middlewares List
                    return fs_1.default.readdirSync(MiddlewaresPath)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.deleteMiddleware,
    },
    {
        name: "add-plugin",
        description: "Add an Epic plugin to the project.",
        params: [
            {
                type: "input",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the plugin.",
                message: "Please provide a plugin name:",
                validator: (value) => {
                    if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value))
                        throw new Error("Please provide a valid lowercase plugin name!");
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.addPlugin,
    },
    {
        name: "link-plugin",
        description: "Manually link an Epic plugin to the project.",
        params: [
            {
                type: "input",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the plugin.",
                message: "Please provide a plugin name:",
                validator: (value) => {
                    if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value))
                        throw new Error("Please provide a valid lowercase plugin name!");
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.linkPlugin,
    },
    {
        name: "link-plugins",
        description: "Manually link all Epic plugins to the project.",
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.linkPlugins,
    },
    {
        name: "update-plugin",
        description: "Update an Epic plugin on the project.",
        params: [
            {
                type: "list",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the plugin.",
                message: "Please select a plugin:",
                choices: () => Object.keys(core_1.ConfigManager.getConfig("main").plugins),
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.updatePlugin,
    },
    {
        name: "remove-plugin",
        description: "Remove an Epic plugin from the project.",
        params: [
            {
                type: "input",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the plugin.",
                message: "Please provide a plugin name to remove:",
                validator: (value) => {
                    if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value))
                        throw new Error("Please provide a valid lowercase plugin name!");
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.removePlugin,
    },
    {
        name: "unlink-plugin",
        description: "Manually unlink an Epic plugin from the project.",
        params: [
            {
                type: "list",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the plugin.",
                message: "Please select a plugin:",
                choices: () => Object.keys(core_1.ConfigManager.getConfig("main").plugins),
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.unlinkPlugin,
    },
    {
        name: "create-job",
        description: "Create a new cron job.",
        params: [
            {
                type: "input",
                name: "name",
                description: "Name of the cron job.",
                alias: ["--name", "-n"],
                message: "Please provide a job name:",
                validator: (value) => {
                    if (!/^[A-Z]\w+$/.test(value))
                        throw new Error(`Please provide a valid cron job name!`);
                },
            },
            {
                type: "input",
                name: "description",
                description: "Description for the cron job.",
                alias: ["--description", "-d"],
                message: "Please provide the job description:",
                default: "N/A",
            },
            {
                type: "input",
                name: "templateDir",
                description: "Cron job templates container directory.",
                alias: ["--templateDir", "-td"],
                skip: true,
            },
            {
                type: "list",
                name: "template",
                description: "Template of the Cron job",
                message: "Please provide a cron job template:",
                choices: (options) => {
                    // Cron Job Path
                    const CronJobDir = options.templateDir ||
                        path_1.default.join(core_1.ConfigManager.getConfig("main").paths.templates, "./job/");
                    // Resolve Directory
                    fs_1.default.mkdirSync(CronJobDir, { recursive: true });
                    // Templates List
                    return fs_1.default.readdirSync(CronJobDir)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.createJob,
    },
    {
        name: "delete-job",
        description: "Remove job from project.",
        params: [
            {
                type: "list",
                name: "name",
                alias: ["--name", "-n"],
                description: "Name of the job.",
                message: "Please provide a job name:",
                choices: () => {
                    const JobsPath = core_1.ConfigManager.getConfig("main").paths.jobs;
                    // Resolve Directory
                    fs_1.default.mkdirSync(JobsPath, { recursive: true });
                    // Jobs List
                    return fs_1.default.readdirSync(JobsPath)
                        .filter((file) => /\.ts$/g.test(file))
                        .map((file) => file.replace(/\.\w*/g, ""));
                },
            },
        ],
        before: () => {
            // Check Configuration File
            if (!core_1.ConfigManager.hasConfig("main"))
                throw new Error("Please initialize a project first!");
        },
        method: project_1.Project.deleteJob,
    },
];
