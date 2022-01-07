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
exports.Core = exports.ConfigManager = void 0;
const listr_1 = __importDefault(require("listr"));
const execa_1 = __importDefault(require("execa"));
const epic_config_manager_1 = require("@saffellikhan/epic-config-manager");
exports.ConfigManager = new epic_config_manager_1.EpicConfigManager({
    configFileNames: {
        main: "epic.config.json",
        transactions: "epic.transactions.json",
        resources: "epic.resources.json",
    },
})
    .init({
    main: {
        version: 1,
        framework: "express",
        type: "application",
        packageManager: "npm",
        name: "my-project",
        description: "This is my project.",
        brand: {
            name: "My Company",
            country: "Pakistan",
            address: "House #22, Multan",
        },
        database: {
            engine: "mongodb",
            uri: "mongodb://localhost:27017/test",
        },
        supportedDBEngines: ["mongodb"],
        plugins: {},
        paths: {
            templates: "./src/templates/",
            contollers: "./src/controllers/",
            middlewares: "./src/middlewares/",
            models: "./src/models/",
        },
        other: {},
    },
    transactions: {
        version: 1,
        transactions: [],
        lastAccess: {},
    },
    resources: {
        version: 1,
        resources: [],
    },
})
    .override("main", (data) => {
    // Check Configuration Version
    if (data.version !== 1)
        throw new Error(`Invalid configuration version! Currently installed CLI expects epic.config version 1.`);
    return data;
})
    .override("transactions", (data) => {
    // Check Transactions Version
    if (data.version !== 1)
        throw new Error(`Invalid transactions version! Currently installed CLI expects epic.transactions version 1.`);
    return data;
})
    .override("resources", (data) => {
    // Check Transactions Version
    if (data.version !== 1)
        throw new Error(`Invalid resources version! Currently installed CLI expects epic.resources version 1.`);
    return data;
});
class Core {
    static install() {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!exports.ConfigManager.hasConfig("transactions"))
                            throw new Error("No Transactions found on the project!");
                    }),
                },
                {
                    title: "Executing commands",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Get Configuration
                        const Transactions = exports.ConfigManager.getConfig("transactions");
                        // Execute Each Transaction
                        for (const Transaction of Transactions.transactions) {
                            // Get Command
                            const Command = require("../make-cli").EpicCli.getCommand(Transaction.command);
                            // Change Command Source
                            Command.source = "Manual";
                            // Execute Command
                            yield Command.method(Transaction.params, Command);
                        }
                    }),
                },
            ]).run();
        });
    }
    static update() {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Preparing to update the CLI...",
                    task: () => execa_1.default("npm", ["r", "-g", require("../../package.json").name]),
                },
                {
                    title: "Updating the CLI...",
                    task: () => execa_1.default("npm", ["i", "-g", require("../../package.json").name]),
                },
            ]).run();
        });
    }
}
exports.Core = Core;
