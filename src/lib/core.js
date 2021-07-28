"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Core = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
