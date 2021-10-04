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
    static SamplesPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.templates);
    }
    static ControllersPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.contollers);
    }
    static SchemasPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.schemas);
    }
    static MiddlewaresPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.middlewares);
    }
    static getPackage() {
        return require(Project.PackagePath());
    }
    static configure(Configuration) {
        // Get Package Information
        const Package = Project.getPackage();
        // Update Package Information
        Package.name = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.name) || Package.name;
        Package.description = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.description) || Package.description;
        Package.private = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.type) === "Application";
        if ((Configuration === null || Configuration === void 0 ? void 0 : Configuration.type) === "Plugin") {
            // Remove Git Information
            Package.homepage = undefined;
            Package.repository = undefined;
            Package.bugs = undefined;
            // Dependencies to Development
            Package.devDependencies = Object.assign(Object.assign({}, Package.dependencies), Package.devDependencies);
            // Empty Dependencies
            Package.dependencies = {};
            // Update Tags
            Package.keywords = ["epic", "plugin"];
        }
        // Put Package Data
        fs_1.default.writeFileSync(Project.PackagePath(), JSON.stringify(Package, undefined, 2));
        // Re-Create Configuration
        core_1.ConfigManager.setConfig("main", Configuration);
        // Create Environment Directory
        fs_1.default.mkdirSync(Project.EnvironmentsPath(), {
            recursive: true,
        });
    }
    static initialize(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Creating or Updating configuration...",
                    task: () => {
                        // Set New Configuration
                        core_1.ConfigManager.setConfig("main", {
                            type: options.type,
                            name: options.name,
                            description: options.description,
                            brand: {
                                name: options.brandName,
                                country: options.brandCountry,
                                address: options.brandAddress,
                            },
                        });
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        if (fs_1.default.existsSync(Project.PackagePath()))
                            // Configure Project
                            Project.configure(core_1.ConfigManager.getConfig("main"));
                    },
                },
            ]).run();
        });
    }
    static create() {
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
                    title: "Configuring your project",
                    task: ({ configuration }) => {
                        if (fs_1.default.existsSync(Project.PackagePath())) {
                            // Configure Project
                            Project.configure(configuration);
                            // Create Environment Files
                            ["development", "production"].forEach((env) => fs_1.default.writeFileSync(path_1.default.join(Project.EnvironmentsPath(), `./.${env}.env`), `ENCRYPTION_KEY=${utils_1.generateRandomKey(32)}`));
                        }
                        else
                            throw new Error(`We did not found a 'package.json' in the project!`);
                    },
                },
                {
                    title: "Installing package dependencies with Yarn",
                    task: (ctx, task) => execa_1.default("yarn").catch(() => {
                        ctx.yarn = false;
                        task.skip("Yarn not available, install it via `npm install -g yarn`");
                    }),
                },
                {
                    title: "Installing package dependencies with npm",
                    enabled: (ctx) => ctx.yarn === false,
                    task: () => execa_1.default("npm", ["install"]),
                },
            ]).run();
        });
    }
    static createController(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            throw new Error("Please initialize a project first!");
                    }),
                },
                {
                    title: "Creating new Controller",
                    task: () => {
                        // Parse Template
                        new epic_parser_1.TemplateParser({
                            inDir: options.templateDir ||
                                path_1.default.join(Project.SamplesPath(), "./controller/"),
                            inFile: `./${options.template}.ts`,
                            outDir: Project.ControllersPath(),
                            outFile: `./${options.name}.ts`,
                        })
                            .parse()
                            .injections({
                            ControllerPrefix: options.prefix,
                        })
                            .push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                            modules: [options.name],
                            location: path_1.default.relative(Project.ControllersPath(), path_1.default.join(Project.SchemasPath(), options.name)).replace(/\\/g, "/"),
                        })
                            .render((_) => _.replace(/@AppPath/g, path_1.default.relative(Project.ControllersPath(), Project.AppPath()).replace(/\\/g, "/")) // Add App Path
                            .replace(/Sample/g, options.name) // Add Name
                        );
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Get Parent Controller Content & Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: options.parent === "None"
                                    ? Project.ControllersPath()
                                    : Project.AppPath(),
                                inFile: `./${options.parent === "None" ? "App.controller" : options.parent}.ts`,
                                outFile: `./${options.parent === "None" ? "App.controller" : options.parent}.ts`,
                            })
                                .parse()
                                .push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                                modules: [options.name + "Controller"],
                                location: `./${options.name}`,
                            })
                                .push("ControllerChildsContainer", "ControllerChildsListTemplate", options.name + "ControllerChilds", {
                                child: options.name + "Controller",
                            })
                                .render();
                        }
                        catch (e) {
                            console.warn("We are unable to parse App.controller properly! Please add the child controller manually.");
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("main", (_) => {
                            // Update Last Access
                            _.lastAccess.controller = options.name;
                            return _;
                        }).setConfig("transactions", (_) => {
                            // Remove Duplicate Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-controller" &&
                                transaction.params.name === options.name));
                            // Add New Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
}
exports.Project = Project;
