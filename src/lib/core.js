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
    version: "1.0",
    type: "Application",
};
Core.DefaultTransactions = {
    version: "1.0",
    data: [],
};
Core.SupportedConfigVersions = ["1.0"];
Core.SupportedTransVersions = ["1.0"];
Core.getConfiguration = () => {
    try {
        return require(path_1.default.join(process.cwd(), "./epic.config.json"));
    }
    catch (e) {
        cli_1.EpicCli.Logger.warn("We are unable to find 'epic.config.json' file in your project! Creating new one.").log();
        return Core.DefaultConfig;
    }
};
Core.setConfiguration = (data) => {
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), "./epic.config.json"), JSON.stringify(data, undefined, 2));
};
Core.getTransactions = () => {
    try {
        return require(path_1.default.join(process.cwd(), "./epic.transactions.json"));
    }
    catch (e) {
        cli_1.EpicCli.Logger.warn("We are unable to find 'epic.transactions.json' file in your project! Creating new one.").log();
        return Core.DefaultTransactions;
    }
};
Core.setTransactions = (data) => {
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), "./epic.transactions.json"), JSON.stringify(data, undefined, 2));
};
