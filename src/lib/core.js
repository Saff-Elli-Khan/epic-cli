"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Core = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cli_1 = require("../cli");
class Core {
}
exports.Core = Core;
Core.RootPath = process.cwd();
Core.AppPath = path_1.default.join(process.cwd(), "./src/");
Core.DefaultConfig = {
    version: 1,
    transactions: [],
};
Core.SupportedConfigVersions = [1];
Core.initialize = (options) => {
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
    // Set New Configuration
    Core.setConfiguration(Core.DefaultConfig);
};
Core.getConfiguration = (strict = false) => {
    try {
        return require(path_1.default.join(Core.RootPath, "./epic.config.json"));
    }
    catch (e) {
        cli_1.EpicCli.Logger.warn("We are unable to find 'epic.config.json' file in your project!").log();
        if (strict)
            return null;
        else
            return Core.DefaultConfig;
    }
};
Core.setConfiguration = (data) => {
    fs_1.default.writeFileSync(path_1.default.join(Core.RootPath, "./epic.config.json"), JSON.stringify(data, undefined, 2));
};
