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
class Core {
}
exports.Core = Core;
Core.RootPath = process.cwd();
Core.DefaultConfig = {
    version: 1,
    paths: {
        samples: "./src/samples/",
        contollers: "./src/controllers/",
        schemas: "./src/schemas/",
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
                // Update Configuration
                Core.getConfiguration().application = {
                    name: options.name,
                    description: options.description,
                    brand: {
                        name: options.brandName,
                        country: options.brandCountry,
                        address: options.brandAddress,
                    },
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
Core.getConfiguration = (strict = false) => {
    try {
        return (Core.DefaultConfig = require(path_1.default.join(Core.RootPath, "./epic.config.json")));
    }
    catch (e) {
        if (strict)
            return null;
        else
            return Core.DefaultConfig;
    }
};
Core.setConfiguration = (data) => {
    fs_1.default.writeFileSync(path_1.default.join(Core.RootPath, "./epic.config.json"), JSON.stringify(data, undefined, 2));
};
Core.removeConfiguration = () => {
    fs_1.default.unlinkSync(path_1.default.join(Core.RootPath, "./epic.config.json"));
};
