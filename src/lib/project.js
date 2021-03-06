"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const execa_1 = __importDefault(require("execa"));
const listr_1 = __importDefault(require("listr"));
const core_1 = require("./core");
const utils_1 = require("./utils");
const epic_parser_1 = require("@saffellikhan/epic-parser");
class Project {
    static PackagePath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, "./package.json");
    }
    static EnvironmentsPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, "./env/");
    }
    static AppPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, "./src/");
    }
    static AppCore() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, "./src/core/");
    }
    static SamplesPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.templates);
    }
    static ControllersPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.contollers);
    }
    static ModelsPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.models);
    }
    static MiddlewaresPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.middlewares);
    }
    static JobsPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.jobs);
    }
    static getPackage(silent = false) {
        if (!fs_1.default.existsSync(Project.PackagePath()))
            if (!silent)
                throw new Error(`package.json has not been found!`);
            else
                return null;
        return require(Project.PackagePath());
    }
    static getAdminDashboardPathName() {
        return "admin";
    }
    static configure(Configuration) {
        // Get Package Information
        const Package = Project.getPackage(true);
        if (Package !== null) {
            // Update Package Information
            Package.name = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.name) || Package.name;
            Package.description = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.description) || Package.description;
            Package.private = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.type) === "application";
            if ((Configuration === null || Configuration === void 0 ? void 0 : Configuration.type) === "plugin") {
                // Dependencies to Development
                Package.devDependencies = Object.assign(Object.assign({}, Package.dependencies), Package.devDependencies);
                // Empty Dependencies
                Package.dependencies = {};
                // Update Tags
                Package.keywords = ["epic", "plugin"];
            }
            // Put Package Data
            fs_1.default.writeFileSync(Project.PackagePath(), JSON.stringify(Package, undefined, 2));
        }
        // Re-Create Configuration
        core_1.ConfigManager.setConfig("main", Configuration);
    }
    static initialize(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Creating/Updating configuration...",
                    task: () => {
                        // Set New Configuration
                        core_1.ConfigManager.setConfig("main", (config) => ({
                            type: options.type,
                            name: options.name,
                            description: options.description,
                            brand: {
                                name: options.brandName,
                                country: options.brandCountry,
                                address: options.brandAddress,
                            },
                            database: {
                                engine: options.dbEngine,
                                type: (options.dbEngine === "mongodb" ? "simple" : "pool"),
                                uri: options.dbEngine === "mongodb"
                                    ? "mongodb://localhost:27017/test"
                                    : "mysql://root@localhost:3306/test",
                            },
                            supportedDBEngines: (options.dbEngine === "mongodb"
                                ? ["mongodb"]
                                : ["mysql"]),
                            other: Object.assign(Object.assign({}, config.other), { [options.name]: {} }),
                        }));
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => Project.configure(core_1.ConfigManager.getConfig("main")),
                },
            ]).run();
        });
    }
    static create(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: (ctx) => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            yield execa_1.default("epic", ["init", "--yes"]);
                        // Get Configuration
                        ctx.configuration = core_1.ConfigManager.getConfig("main");
                        // Remove Configuration
                        core_1.ConfigManager.delConfig("main");
                    }),
                },
                {
                    title: "Cloning repository to current directory",
                    task: ({ configuration }) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            // Remove .git folder
                            yield execa_1.default("npx", ["rimraf", "./.git"]);
                            // Clone Repository
                            yield execa_1.default("git", [
                                "clone",
                                "https://github.com/Saff-Elli-Khan/epic-application",
                                ".",
                            ]);
                            // Remove .git folder
                            yield execa_1.default("npx", ["rimraf", "./.git"]);
                            // Initialize New Repository
                            yield execa_1.default("git", ["init"]);
                        }
                        catch (error) {
                            // Configure Project
                            Project.configure(configuration);
                            // Throw Git Error
                            throw error;
                        }
                    }),
                },
                {
                    title: `Cloning dashboard to the ${Project.getAdminDashboardPathName()} directory`,
                    task: () => execa_1.default("git", [
                        "clone",
                        "https://github.com/Saff-Elli-Khan/epic-dashboard",
                        `./${Project.getAdminDashboardPathName()}/`,
                    ]),
                    skip: () => !options.admin,
                },
                {
                    title: "Configuring your project",
                    task: ({ configuration }) => {
                        // Configure Project
                        Project.configure(configuration);
                        // Create Environment Directory
                        fs_1.default.mkdirSync(Project.EnvironmentsPath(), {
                            recursive: true,
                        });
                        // Create Environment Files
                        ["development", "production"].forEach((env) => fs_1.default.writeFileSync(path_1.default.join(Project.EnvironmentsPath(), `./.${env}.env`), `ENCRYPTION_KEY=${utils_1.generateRandomKey(32)}`));
                    },
                },
                {
                    title: "Installing application dependencies with Yarn",
                    task: (ctx, task) => execa_1.default("yarn")
                        .then(() => {
                        core_1.ConfigManager.setConfig("main", (_) => {
                            // Set Package Manager
                            _.packageManager = "yarn";
                            return _;
                        });
                    })
                        .catch(() => {
                        ctx.yarn = false;
                        task.skip("Yarn not available, install it via `npm install -g yarn`");
                    }),
                    skip: () => !options.installation || !options.yarn,
                },
                {
                    title: "Installing application dependencies with npm",
                    task: () => execa_1.default("npm", ["install"]).then(() => {
                        core_1.ConfigManager.setConfig("main", (_) => {
                            // Set Package Manager
                            _.packageManager = "npm";
                            return _;
                        });
                    }),
                    enabled: (ctx) => ctx.yarn === false || !options.yarn,
                    skip: () => !options.installation,
                },
                {
                    title: "Installing admin dashboard dependencies with Yarn",
                    task: (ctx, task) => execa_1.default("yarn", undefined, {
                        cwd: path_1.default.join(core_1.ConfigManager.Options.rootPath, `./${Project.getAdminDashboardPathName()}/`),
                    }).catch(() => {
                        ctx.yarn = false;
                        task.skip("Yarn not available, you can install it via `npm install -g yarn` if needed.");
                    }),
                    skip: () => !options.installation || !options.admin || !options.yarn,
                },
                {
                    title: "Installing admin dashboard dependencies with npm",
                    task: () => execa_1.default("npm", ["install"], {
                        cwd: path_1.default.join(core_1.ConfigManager.Options.rootPath, `./${Project.getAdminDashboardPathName()}/`),
                    }),
                    enabled: (ctx) => ctx.yarn === false || !options.yarn,
                    skip: () => !options.installation || !options.admin,
                },
            ]).run();
        });
    }
    static createController(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Creating new Controller",
                    task: () => {
                        if (!fs_1.default.existsSync(path_1.default.join(Project.ControllersPath(), `./${options.name}.ts`))) {
                            // Parse Template
                            const Parsed = new epic_parser_1.TemplateParser({
                                inDir: options.templateDir ||
                                    path_1.default.join(Project.SamplesPath(), "./controller/"),
                                inFile: `./${options.template}.ts`,
                                outDir: Project.ControllersPath(),
                                outFile: `./${options.name}.ts`,
                            })
                                .parse()
                                .injections({
                                ControllerPrefix: options.prefix,
                                AppName: core_1.ConfigManager.getConfig("main").name,
                            });
                            // Push Database Model
                            if (options.template === "default")
                                Parsed.push("ImportsContainer", "ImportsTemplate", options.name + "ModelImport", {
                                    modules: [options.name],
                                    location: path_1.default.relative(Project.ControllersPath(), path_1.default.join(Project.ModelsPath(), options.name)).replace(/\\/g, "/"),
                                });
                            // Render Controller Content
                            Parsed.render((_) => _.replace(/Sample/g, options.name));
                        }
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Get Parent Controller Content & Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: options.parent === "None"
                                    ? Project.AppPath()
                                    : Project.ControllersPath(),
                                inFile: `./${options.parent === "None" ? "core/controllers" : options.parent}.ts`,
                                outFile: `./${options.parent === "None" ? "core/controllers" : options.parent}.ts`,
                            })
                                .parse()
                                .push("ImportsContainer", "ImportsTemplate", options.name + "ControllerImport", {
                                modules: [options.name + "Controller"],
                                location: `./${path_1.default.relative(options.parent === "None"
                                    ? Project.AppCore()
                                    : Project.ControllersPath(), path_1.default.join(Project.ControllersPath(), options.name)).replace(/\\/g, "/")}`,
                            })
                                .push("ControllerChildsContainer", "ControllerChildTemplate", options.name + "ControllerChilds", {
                                child: options.name + "Controller",
                            })
                                .render();
                        }
                        catch (error) {
                            console.warn("We are unable to parse core/controllers properly! Please add the controller manually.", error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Update Last Access
                            _.lastAccess.controller = options.name;
                            // Remove Duplicate Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-controller" &&
                                transaction.params.name === options.name));
                            // Add New Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        }).setConfig("resources", (_) => {
                            // Remove Duplicate Resource
                            _.resources = _.resources.filter((resource) => !(resource.type === "controller" &&
                                resource.name === options.name));
                            // Add New Resource
                            _.resources.push({
                                source: core_1.ConfigManager.getConfig("main").name,
                                type: "controller",
                                name: options.name,
                                parent: options.parent,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static createModel(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Creating new Model",
                    task: () => {
                        if (!fs_1.default.existsSync(path_1.default.join(Project.ModelsPath(), `./${options.name}.ts`)))
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: options.templateDir ||
                                    path_1.default.join(Project.SamplesPath(), "./model/"),
                                inFile: `./${options.template}.ts`,
                                outDir: Project.ModelsPath(),
                                outFile: `./${options.name}.ts`,
                            })
                                .parse()
                                .injections({
                                AppName: core_1.ConfigManager.getConfig("main").name,
                            })
                                .render((_) => _.replace(/Sample/g, options.name));
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template core/models.ts
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./core/models.ts`,
                                outFile: `./core/models.ts`,
                            })
                                .parse()
                                .push("ImportsContainer", "ImportsTemplate", options.name + "ModelImport", {
                                modules: [options.name],
                                location: `./${path_1.default.relative(Project.AppCore(), path_1.default.join(Project.ModelsPath(), options.name)).replace(/\\/g, "/")}`,
                            })
                                .push("ModelListContainer", "ModelListTemplate", options.name + "Model", {
                                model: options.name,
                            })
                                .render();
                        }
                        catch (error) {
                            console.warn("We are unable to parse core/models properly! Please add the model to the list manually.", error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Update Last Access
                            _.lastAccess.model = options.name;
                            // Remove Duplicate Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-model" &&
                                transaction.params.name === options.name));
                            // Add New Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        }).setConfig("resources", (_) => {
                            // Remove Duplicate Resource
                            _.resources = _.resources.filter((resource) => !(resource.type === "model" && resource.name === options.name));
                            // Add New Resource
                            _.resources.push({
                                source: core_1.ConfigManager.getConfig("main").name,
                                type: "model",
                                name: options.name,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static deleteModel(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Deleting the Model",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Delete Model
                        fs_1.default.unlinkSync(path_1.default.join(Project.ModelsPath(), `./${options.name}.ts`));
                    }),
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./core/models.ts`,
                                outFile: `./core/models.ts`,
                            })
                                .parse()
                                .pop("ImportsContainer", options.name + "ModelImport")
                                .pop("ModelListContainer", options.name + "Model")
                                .render();
                        }
                        catch (error) {
                            console.warn(`We are unable to parse core/models properly! Please remove the model from core/models manually.`, error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Update Last Access
                            delete _.lastAccess.model;
                            // Remove Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-model" &&
                                transaction.params.name === options.name));
                            return _;
                        }).setConfig("resources", (_) => {
                            _.resources = _.resources.filter((resource) => !(resource.type === "model" && resource.name === options.name));
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static createModule(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Update Temporary Command Name
            command.name = "create-controller";
            // Create New Controller
            yield Project.createController(options, command);
            // Update Temporary Command Name
            command.name = "create-model";
            // Create New Model
            yield Project.createModel(options, command);
        });
    }
    static deleteModule(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Project.deleteController(options);
            yield Project.deleteModel(options);
        });
    }
    static deleteMiddleware(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Deleting the Middlware",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Delete Middleware
                        fs_1.default.unlinkSync(path_1.default.join(Project.MiddlewaresPath(), `./${options.name}.ts`));
                    }),
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./core/middlewares.ts`,
                                outFile: `./core/middlewares.ts`,
                            })
                                .parse()
                                .pop("ImportsContainer", options.name + "MiddlewareImport")
                                .pop("MiddlewaresContainer", options.name + "Middleware")
                                .render();
                        }
                        catch (error) {
                            console.warn(`We are unable to parse core/middlewares properly! Please remove the middleware from core/middlewares manually.`, error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Update Last Access
                            delete _.lastAccess.middleware;
                            // Remove Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-middleware" &&
                                transaction.params.name === options.name));
                            return _;
                        }).setConfig("resources", (_) => {
                            _.resources = _.resources.filter((resource) => !(resource.type === "middleware" &&
                                resource.name === options.name));
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static createJob(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Creating new Cron Job...",
                    task: () => {
                        if (!fs_1.default.existsSync(path_1.default.join(Project.JobsPath(), `./${options.name}.ts`)))
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: options.templateDir ||
                                    path_1.default.join(Project.SamplesPath(), "./job/"),
                                inFile: `./${options.template}.ts`,
                                outDir: Project.JobsPath(),
                                outFile: `./${options.name}.ts`,
                            })
                                .parse()
                                .injections({
                                AppName: core_1.ConfigManager.getConfig("main").name,
                            })
                                .render((_) => _.replace(/Sample/g, options.name));
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./core/jobs.ts`,
                                outFile: `./core/jobs.ts`,
                            })
                                .parse()
                                .push("ImportsContainer", "ImportsTemplate", options.name + "JobImport", {
                                modules: [options.name + "Job"],
                                location: `./${path_1.default.relative(Project.AppCore(), path_1.default.join(Project.JobsPath(), options.name)).replace(/\\/g, "/")}`,
                            })
                                .push("JobsContainer", "JobTemplate", options.name + "Job", {
                                job: options.name + "Job",
                            })
                                .render();
                        }
                        catch (error) {
                            console.warn("We are unable to parse core/jobs properly! Please add the job manually.", error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Update Last Access
                            _.lastAccess.job = options.name;
                            // Remove Duplicate Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-job" &&
                                transaction.params.name === options.name));
                            // Add New Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        }).setConfig("resources", (_) => {
                            // Remove Duplicate Resource
                            _.resources = _.resources.filter((resource) => !(resource.type === "job" && resource.name === options.name));
                            // Add New Resource
                            _.resources.push({
                                source: core_1.ConfigManager.getConfig("main").name,
                                type: "job",
                                name: options.name,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static deleteJob(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Deleting the Job...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Delete Job
                        fs_1.default.unlinkSync(path_1.default.join(Project.JobsPath(), `./${options.name}.ts`));
                    }),
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./core/jobs.ts`,
                                outFile: `./core/jobs.ts`,
                            })
                                .parse()
                                .pop("ImportsContainer", options.name + "JobImport")
                                .pop("JobsContainer", options.name + "Job")
                                .render();
                        }
                        catch (error) {
                            console.warn(`We are unable to parse core/jobs properly! Please remove the job from core/jobs manually.`, error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Update Last Access
                            delete _.lastAccess.job;
                            // Remove Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-job" &&
                                transaction.params.name === options.name));
                            return _;
                        }).setConfig("resources", (_) => {
                            _.resources = _.resources.filter((resource) => !(resource.type === "job" && resource.name === options.name));
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static addPlugin(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Installing Plugin...",
                    task: () => {
                        // Get Configuration
                        const Configuration = core_1.ConfigManager.getConfig("main");
                        // Install Plugin
                        if (Configuration.packageManager === "npm")
                            return execa_1.default("npm", ["install", options.name]);
                        else if (Configuration.packageManager === "yarn")
                            execa_1.default("yarn", ["add", options.name]);
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Remove Duplicate Transactions
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === command.name &&
                                transaction.params.name === options.name));
                            // Add Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
            // Link Plugin
            if (command.source === "Cli")
                yield Project.linkPlugin(options);
        });
    }
    static linkPlugin(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Resolve Plugin Name
            options.name = options.name.split(/(?!^@)@/g)[0];
            yield new listr_1.default([
                {
                    title: `Making sure we are ready to link plugin '${options.name}' to the project...`,
                    task: (ctx) => {
                        // Create Path to Plugin
                        const PluginPath = path_1.default.join(core_1.ConfigManager.Options.rootPath, `./node_modules/${options.name}/epic.config.json`);
                        // Check If Valid Plugin
                        if (!fs_1.default.existsSync(PluginPath))
                            throw new Error(`We didn't found Configuration file on the plugin directory on path '${PluginPath}'!`);
                        // Validate Plugin
                        ctx.configuration = require(path_1.default.join(core_1.ConfigManager.Options.rootPath, `./node_modules/${options.name}/epic.config.json`));
                        if (ctx.configuration.type !== "plugin")
                            throw new Error(`${options.name} is not a plugin! Cannot link to the project.`);
                        // Verify Database Engine Support
                        if (!ctx.configuration.supportedDBEngines.includes(core_1.ConfigManager.getConfig("main").database.engine))
                            throw new Error(`Your project does not support the database engine used in this plugin!`);
                        if (!Object.keys(core_1.ConfigManager.getConfig("main").plugins).includes(options.name) &&
                            fs_1.default.existsSync(path_1.default.join(core_1.ConfigManager.Options.rootPath, `./node_modules/${options.name}/epic.resources.json`))) {
                            // Check If Resources Exist
                            // Get Package
                            ctx.package = require(path_1.default.join(core_1.ConfigManager.Options.rootPath, `./node_modules/${options.name}/package.json`));
                            // Get Plugin Resources
                            ctx.resources = require(path_1.default.join(core_1.ConfigManager.Options.rootPath, `./node_modules/${options.name}/epic.resources.json`));
                            // Get Current Resources
                            const Resources = core_1.ConfigManager.getConfig("resources").resources;
                            // Check Resource Version
                            if (ctx.resources && ctx.resources.version === 1) {
                                // Filter Conflicting Resources
                                const Conflictions = ctx.resources.resources
                                    .filter((resource) => !resource.parent || resource.parent === "None")
                                    .filter((resource) => Resources.reduce((conflicts, Resource) => !conflicts
                                    ? resource.type === Resource.type &&
                                        resource.name === Resource.name
                                    : conflicts, false));
                                if (Conflictions.length) {
                                    console.log("Conflicting Resources:", Conflictions);
                                    ctx.resources.resources = ctx.resources.resources.filter((resource) => !Conflictions.filter((item) => resource.type === item.type &&
                                        resource.name === item.name).length);
                                }
                            }
                            else
                                throw new Error(`We cannot link this plugin! Resource version is not supported.`);
                        }
                    },
                },
                {
                    title: "Linking the plugin...",
                    task: (ctx) => __awaiter(this, void 0, void 0, function* () {
                        // Import Plugin Settings to the Project
                        core_1.ConfigManager.setConfig("main", (_) => {
                            _.other[options.name] = Object.assign(Object.assign({}, ctx.configuration.other[options.name]), _.other[options.name]);
                            return _;
                        });
                        // Create Typings Copy Function
                        const CopyTypings = (source, target, options) => {
                            let TypingList = [];
                            fs_1.default.readdirSync(source).forEach((item) => {
                                if (item !== "logs") {
                                    const CurrentItem = path_1.default.join(source, item);
                                    if (fs_1.default.lstatSync(CurrentItem).isDirectory())
                                        TypingList = Array.from(new Set([
                                            ...TypingList,
                                            ...CopyTypings(CurrentItem, target, {
                                                prefix: `${typeof (options === null || options === void 0 ? void 0 : options.prefix) === "string"
                                                    ? "_" + (options === null || options === void 0 ? void 0 : options.prefix) + "_"
                                                    : ""}${item}`,
                                                fileEditor: options === null || options === void 0 ? void 0 : options.fileEditor,
                                            }),
                                        ]));
                                    else {
                                        // Get Typing Content
                                        const TypingContent = fs_1.default.readFileSync(CurrentItem).toString();
                                        let NewFilename = `${typeof (options === null || options === void 0 ? void 0 : options.prefix) === "string"
                                            ? "_" + (options === null || options === void 0 ? void 0 : options.prefix) + "_"
                                            : ""}${item.replace(/^_(.*)_/, "")}`;
                                        let NewFilePath = path_1.default.join(target, NewFilename);
                                        // Check if File already exists
                                        if (fs_1.default.existsSync(NewFilePath)) {
                                            NewFilename = `${typeof (options === null || options === void 0 ? void 0 : options.prefix) === "string"
                                                ? "_" + (options === null || options === void 0 ? void 0 : options.prefix) + "_"
                                                : ""}${item.replace(/^_/, "")}`;
                                            NewFilePath = path_1.default.join(target, NewFilename);
                                        }
                                        fs_1.default.writeFileSync(NewFilePath, typeof (options === null || options === void 0 ? void 0 : options.fileEditor) === "function"
                                            ? options.fileEditor(TypingContent)
                                            : TypingContent);
                                        // Push Typing Filename
                                        TypingList.push(NewFilename);
                                    }
                                }
                            });
                            return TypingList;
                        };
                        // Copy Typings
                        const TypingsDir = path_1.default.join(core_1.ConfigManager.Options.rootPath, `./typings/`);
                        // Resolve Typings Log Directory
                        fs_1.default.mkdirSync(path_1.default.join(TypingsDir, "./logs/"), { recursive: true });
                        // Typings Log
                        fs_1.default.writeFileSync(path_1.default.join(TypingsDir, `./logs/${options.name.replace(/\//g, "-")}.typings.json`), JSON.stringify(CopyTypings(path_1.default.join(core_1.ConfigManager.Options.rootPath, `./node_modules/${options.name}/typings/`), TypingsDir, {
                            prefix: options.name.replace(/\//g, "-"),
                            fileEditor: (_) => _.replace(/@AppPath/g, options.name + `/build`),
                        })));
                        // Add All Resources If Exists
                        if (typeof ctx.resources === "object")
                            ctx.resources.resources.forEach((resource) => {
                                if (resource.type !== "controller" ||
                                    resource.parent === "None") {
                                    // Link Plugin File
                                    const TargetFile = resource.type === "controller"
                                        ? `./core/controllers.ts`
                                        : resource.type === "middleware"
                                            ? `./core/middlewares.ts`
                                            : resource.type === "model"
                                                ? `./core/models.ts`
                                                : resource.type === "job"
                                                    ? `./core/jobs.ts`
                                                    : ``;
                                    // Get Resource Path
                                    const ResourcePath = options.name +
                                        `/build/${resource.type === "controller"
                                            ? `controllers`
                                            : resource.type === "middleware"
                                                ? `middlewares`
                                                : resource.type === "model"
                                                    ? `models`
                                                    : resource.type === "job"
                                                        ? `jobs`
                                                        : ``}/${resource.name}`;
                                    // Parse Template
                                    new epic_parser_1.TemplateParser({
                                        inDir: Project.AppPath(),
                                        inFile: TargetFile,
                                        outFile: TargetFile,
                                    })
                                        .parse()
                                        .push("ImportsContainer", "ImportsTemplate", `${options.name}-${resource.type}-${resource.name}-import`, {
                                        modules: [
                                            resource.name +
                                                (resource.type === "controller"
                                                    ? "Controller"
                                                    : resource.type === "middleware"
                                                        ? "Middleware"
                                                        : resource.type === "job"
                                                            ? "Job"
                                                            : ""),
                                        ],
                                        location: resource.path || ResourcePath,
                                    })
                                        .push(resource.type === "controller"
                                        ? "ControllerChildsContainer"
                                        : resource.type === "middleware"
                                            ? "MiddlewaresContainer"
                                            : resource.type === "model"
                                                ? "ModelListContainer"
                                                : resource.type === "job"
                                                    ? "JobsContainer"
                                                    : "", resource.type === "controller"
                                        ? "ControllerChildTemplate"
                                        : resource.type === "middleware"
                                            ? "MiddlewareTemplate"
                                            : resource.type === "model"
                                                ? "ModelListTemplate"
                                                : resource.type === "job"
                                                    ? "JobTemplate"
                                                    : "", `${options.name}-${resource.type}-${resource.name}-resource`, {
                                        [resource.type === "controller"
                                            ? "child"
                                            : resource.type]: resource.name +
                                            (resource.type === "controller"
                                                ? "Controller"
                                                : resource.type === "middleware"
                                                    ? "Middleware"
                                                    : resource.type === "job"
                                                        ? "Job"
                                                        : ""),
                                    })
                                        .render();
                                    // Push Resource to Record
                                    core_1.ConfigManager.setConfig("resources", (_) => {
                                        // Update Resource Source
                                        resource.source = options.name;
                                        // Add Resource Path
                                        resource.path = resource.path || ResourcePath;
                                        // Remove Duplicate Resource
                                        _.resources = _.resources.filter((oldResource) => !(oldResource.source === resource.source &&
                                            oldResource.type === resource.type &&
                                            oldResource.name === resource.name));
                                        // Add Resource
                                        _.resources.push(resource);
                                        return _;
                                    });
                                }
                            });
                    }),
                },
                {
                    title: "Configuring your project",
                    task: (ctx) => {
                        if (typeof ctx.resources === "object")
                            // Update Configuration & Transactions
                            core_1.ConfigManager.setConfig("main", (_) => {
                                _.plugins[ctx.package.name] = `^${ctx.package.version}`;
                                return _;
                            }).setConfig("transactions", (_) => {
                                // Remove Duplicate Transactions
                                _.transactions = _.transactions.filter((transaction) => !(transaction.command === "link-plugin" &&
                                    transaction.params.name === options.name));
                                // Add Transaction
                                _.transactions.push({
                                    command: "link-plugin",
                                    params: options,
                                });
                                return _;
                            });
                    },
                },
            ]).run();
        });
    }
    static linkPlugins() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(Object.keys(core_1.ConfigManager.getConfig("main").plugins).map((name) => Project.linkPlugin({ name })));
        });
    }
    static updatePlugin(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Unlink Plugin
            if (!options.quick)
                yield Project.unlinkPlugin(options);
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Updating Plugin...",
                    task: () => {
                        // Get Configuration
                        const Configuration = core_1.ConfigManager.getConfig("main");
                        // Install Plugin
                        if (Configuration.packageManager === "npm")
                            return execa_1.default("npm", ["uninstall", options.name]).then(() => execa_1.default("npm", ["install", options.name]));
                        else if (Configuration.packageManager === "yarn")
                            execa_1.default("yarn", ["remove", options.name]).then(() => execa_1.default("yarn", ["add", options.name]));
                    },
                },
            ]).run();
            // Link Plugin
            if (!options.quick)
                yield Project.linkPlugin(options);
        });
    }
    static removePlugin(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Unlink Plugin
            if (command.source === "Cli")
                yield Project.unlinkPlugin(options);
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Uninstalling the Plugin...",
                    task: () => {
                        // Get Configuration
                        const Configuration = core_1.ConfigManager.getConfig("main");
                        // Install Plugin
                        if (Configuration.packageManager === "npm")
                            return execa_1.default("npm", ["uninstall", options.name]);
                        else if (Configuration.packageManager === "yarn")
                            execa_1.default("yarn", ["remove", options.name]);
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("transactions", (_) => {
                            // Remove Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "add-plugin" &&
                                transaction.params.name === options.name));
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static unlinkPlugin(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => {
                        // Check If Plugin Installed
                        if (!core_1.ConfigManager.getConfig("main").plugins[options.name])
                            throw new Error(`Plugin '${options.name}' is not installed!`);
                    },
                },
                {
                    title: "Unlinking the plugin...",
                    task: (ctx) => {
                        // Get Current Project Resources
                        ctx.resources = core_1.ConfigManager.getConfig("resources").resources.filter((resource) => resource.source === options.name);
                        // Remove Current Plugin Resouces
                        if (typeof ctx.resources === "object")
                            ctx.resources.forEach((resource) => {
                                const TargetFile = resource.type === "controller"
                                    ? `./core/controllers.ts`
                                    : resource.type === "middleware"
                                        ? `./core/middlewares.ts`
                                        : resource.type === "model"
                                            ? `./core/models.ts`
                                            : resource.type === "job"
                                                ? `./core/jobs.ts`
                                                : ``;
                                // Parse Template
                                new epic_parser_1.TemplateParser({
                                    inDir: Project.AppPath(),
                                    inFile: TargetFile,
                                    outFile: TargetFile,
                                })
                                    .parse()
                                    .pop("ImportsContainer", `${options.name}-${resource.type}-${resource.name}-import`)
                                    .pop(resource.type === "controller"
                                    ? "ControllerChildsContainer"
                                    : resource.type === "middleware"
                                        ? "MiddlewaresContainer"
                                        : resource.type === "model"
                                            ? "ModelListContainer"
                                            : resource.type === "job"
                                                ? "JobsContainer"
                                                : "", `${options.name}-${resource.type}-${resource.name}-resource`)
                                    .render();
                            });
                        try {
                            // Remove Typings
                            const TypingsDir = path_1.default.join(core_1.ConfigManager.Options.rootPath, `./typings/`);
                            const TypingLogFile = path_1.default.join(TypingsDir, `./logs/${options.name.replace(/\//g, "-")}.typings.json`);
                            // Read Log File (Delete Typings)
                            (fs_1.default.existsSync(TypingLogFile)
                                ? JSON.parse(fs_1.default.readFileSync(TypingLogFile).toString())
                                : []).forEach((file) => fs_1.default.unlinkSync(path_1.default.join(TypingsDir, file)));
                            // Delete Log File
                            fs_1.default.unlinkSync(TypingLogFile);
                        }
                        catch (_a) {
                            // Do nothing...
                        }
                    },
                },
                {
                    title: "Configuring your project",
                    task: (ctx) => {
                        if (typeof ctx.resources === "object")
                            // Update Configuration & Transactions
                            core_1.ConfigManager.setConfig("main", (_) => {
                                delete _.plugins[options.name];
                                return _;
                            })
                                .setConfig("transactions", (_) => {
                                // Remove Transaction
                                _.transactions = _.transactions.filter((transaction) => !(transaction.command === "link-plugin" &&
                                    transaction.params.name === options.name));
                                return _;
                            })
                                .setConfig("resources", (_) => {
                                ctx.resources.forEach((resource) => {
                                    // Remove Resource
                                    _.resources = _.resources.filter((oldResource) => !(oldResource.type === resource.type &&
                                        oldResource.name === resource.name));
                                });
                                return _;
                            });
                    },
                },
            ]).run();
        });
    }
    static build() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new listr_1.default([
                {
                    title: "Making sure we are ready to build the project...",
                    task: () => {
                        if (!core_1.ConfigManager.hasConfig("main"))
                            throw new Error(`May be you are not inside the project root directory!`);
                        if (!["express"].includes(core_1.ConfigManager.getConfig("main").framework))
                            throw new Error(`We cannot build this project!`);
                    },
                },
                {
                    title: "Building the project",
                    task: () => execa_1.default("npx -y shx rm -rf tsconfig.tsbuildinfo build && npx -y ttsc -p tsconfig.json && npx shx rm -rf ./build/templates && npx shx cp -R ./src/templates/ ./build/templates/"),
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        // Get Exports File Path
                        const ExportsPath = path_1.default.join(core_1.ConfigManager.Options.rootPath, `./build/exports.js`);
                        // Add Exports Resolver File
                        fs_1.default.writeFileSync(ExportsPath, fs_1.default.readFileSync(ExportsPath)
                            .toString()
                            .replace(/__exportStar\(require\("(.*)"\),\s*exports\)/g, (_, path) => `__exportStar(require(require("path").join(process.cwd(), "./build", "${path}")), exports)`));
                    },
                },
            ]).run();
        });
    }
}
exports.Project = Project;
Project.deleteController = (options) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Deleting the Controller",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Delete Controller
                fs_1.default.unlinkSync(path_1.default.join(Project.ControllersPath(), `./${options.name}.ts`));
            }),
        },
        {
            title: "Configuring your project",
            task: () => {
                // Find & Undo (create-controller) Transaction related to this Controller
                const Transaction = core_1.ConfigManager.getConfig("transactions").transactions.reduce((result, transaction) => result
                    ? result
                    : transaction.command === "create-controller" &&
                        transaction.params.name === options.name
                        ? transaction
                        : null, null);
                // If Transaction Exists
                if (Transaction && typeof Transaction.params.parent === "string") {
                    try {
                        // Get Parent Controller Content & Parse Template
                        new epic_parser_1.TemplateParser({
                            inDir: Transaction.params.parent === "None"
                                ? Project.AppPath()
                                : Project.ControllersPath(),
                            inFile: `./${Transaction.params.parent === "None"
                                ? "core/controllers"
                                : Transaction.params.parent}.ts`,
                            outFile: `./${Transaction.params.parent === "None"
                                ? "core/controllers"
                                : Transaction.params.parent}.ts`,
                        })
                            .parse()
                            .pop("ImportsContainer", options.name + "ControllerImport")
                            .pop("ControllerChildsContainer", options.name + "ControllerChilds")
                            .render();
                    }
                    catch (error) {
                        console.warn(`We are unable to parse parent controller properly! Please remove the child controller from "${Transaction.params.parent}" controller manually.`, error);
                    }
                }
                // Update Configuration & Transactions
                core_1.ConfigManager.setConfig("transactions", (_) => {
                    // Update Last Access
                    delete _.lastAccess.controller;
                    // Remove Transaction
                    _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-controller" &&
                        transaction.params.name === options.name));
                    return _;
                }).setConfig("resources", (_) => {
                    _.resources = _.resources.filter((resource) => !(resource.type === "controller" &&
                        resource.name === options.name));
                    return _;
                });
            },
        },
    ]).run();
});
Project.createMiddleware = (options, command) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Creating new Middleware",
            task: () => {
                if (!fs_1.default.existsSync(path_1.default.join(Project.MiddlewaresPath(), `./${options.name}.ts`)))
                    // Parse Template
                    new epic_parser_1.TemplateParser({
                        inDir: options.templateDir ||
                            path_1.default.join(Project.SamplesPath(), "./middleware/"),
                        inFile: `./${options.template}.ts`,
                        outDir: Project.MiddlewaresPath(),
                        outFile: `./${options.name}.ts`,
                    })
                        .parse()
                        .render((_) => _.replace(/Sample/g, options.name));
            },
        },
        {
            title: "Configuring your project",
            task: () => {
                try {
                    // Parse Template
                    new epic_parser_1.TemplateParser({
                        inDir: Project.AppPath(),
                        inFile: `./core/middlewares.ts`,
                        outFile: `./core/middlewares.ts`,
                    })
                        .parse()
                        .push("ImportsContainer", "ImportsTemplate", options.name + "MiddlewareImport", {
                        modules: [options.name + "Middleware"],
                        location: `./${path_1.default.relative(Project.AppCore(), path_1.default.join(Project.MiddlewaresPath(), options.name)).replace(/\\/g, "/")}`,
                    })
                        .push("MiddlewaresContainer", "MiddlewareTemplate", options.name + "Middleware", {
                        middleware: options.name + "Middleware",
                    })
                        .injections({
                        AppName: core_1.ConfigManager.getConfig("main").name,
                    })
                        .render();
                }
                catch (error) {
                    console.warn("We are unable to parse core/middlewares properly! Please add the middleware manually.", error);
                }
                // Update Configuration & Transactions
                core_1.ConfigManager.setConfig("transactions", (_) => {
                    // Update Last Access
                    _.lastAccess.middleware = options.name;
                    // Remove Duplicate Transaction
                    _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-middleware" &&
                        transaction.params.name === options.name));
                    // Add New Transaction
                    _.transactions.push({
                        command: command.name,
                        params: options,
                    });
                    return _;
                }).setConfig("resources", (_) => {
                    // Remove Duplicate Resource
                    _.resources = _.resources.filter((resource) => !(resource.type === "middleware" &&
                        resource.name === options.name));
                    // Add New Resource
                    _.resources.push({
                        source: core_1.ConfigManager.getConfig("main").name,
                        type: "middleware",
                        name: options.name,
                    });
                    return _;
                });
            },
        },
    ]).run();
});
