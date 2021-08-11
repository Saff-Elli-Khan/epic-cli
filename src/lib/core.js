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
exports.Core = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const listr_1 = __importDefault(require("listr"));
const project_1 = require("./project");
const cli_1 = require("../cli");
const epic_config_manager_1 = require("epic-config-manager");
class Core {
}
exports.Core = Core;
Core.RootPath = process.cwd();
Core.ConfigFileName = "epic.config.json";
Core.ConfigFilePath = () => path_1.default.join(Core.RootPath, Core.ConfigFileName);
Core.DefaultConfig = {
    version: 1,
    type: "Application",
    name: "demo-project",
    description: "This is a demo project.",
    history: {
        controller: null,
        schema: null,
        middleware: null,
    },
    brand: {
        name: "Demo Company",
        country: "Pakistan",
        address: "House #22, Multan",
    },
    paths: {
        samples: "./src/samples/",
        contollers: "./src/controllers/",
        schemas: "./src/schemas/",
        middlewares: "./src/middlewares/",
    },
    transactions: [],
};
Core.SupportedConfigVersions = [1];
Core.initialize = (options) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Creating/Updating configuration...",
            task: () => {
                // Get Configuration
                const Configuration = Core.getConfiguration();
                // Update Configuration
                Configuration.type = options.type;
                Configuration.name = options.name;
                Configuration.description = options.description;
                Configuration.brand = {
                    name: options.brandName,
                    country: options.brandCountry,
                    address: options.brandAddress,
                };
            },
        },
        {
            title: "Saving Configuration",
            task: () => {
                // Set New Configuration
                Core.setConfiguration(Core.DefaultConfig);
            },
        },
        {
            title: "Configuring your project",
            task: () => {
                if (fs_1.default.existsSync(project_1.Project.PackagePath)) {
                    // Configure Project
                    project_1.Project.configure(Core.getConfiguration());
                }
            },
        },
    ]).run();
});
Core.install = () => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!fs_1.default.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
                    throw new Error("Please initialize a project first!");
            }),
        },
        {
            title: "Executing commands",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Get Configuration
                const Configuration = Core.getConfiguration();
                // Execute Each Transaction
                for (const Transaction of Configuration.transactions) {
                    // Get Command
                    const Command = cli_1.EpicCli.getCommand(Transaction.command);
                    // Execute Command
                    yield Command.method(Transaction.params, Command);
                }
            }),
        },
    ]).run();
});
Core.getConfiguration = (strict = false) => {
    try {
        // Get Configuration from the file
        const Configuration = (Core.DefaultConfig = epic_config_manager_1.ConfigManagerUtils.deepMerge(Core.DefaultConfig, require(Core.ConfigFilePath())));
        // Check Configuration Version
        if (Core.SupportedConfigVersions.includes(Configuration.version))
            return Configuration;
        else {
            cli_1.EpicCli.Logger.error(`Configuration version is not supported by the current CLI version!`).log();
            throw new Error(`Configuration version not supported!`);
        }
    }
    catch (e) {
        if (strict)
            return null;
        else
            return Core.DefaultConfig;
    }
};
Core.setConfiguration = (data) => {
    fs_1.default.writeFileSync(Core.ConfigFilePath(), JSON.stringify(data, undefined, 2));
};
Core.removeConfiguration = () => {
    fs_1.default.unlinkSync(Core.ConfigFilePath());
};
