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
const epic_config_manager_1 = require("@saffellikhan/epic-config-manager");
exports.ConfigManager = new epic_config_manager_1.EpicConfigManager({
    configFileNames: {
        main: "epic.config.json",
        transactions: "epic.transactions.json",
    },
})
    .init({
    main: {
        version: 1,
        framework: "Express",
        type: "Application",
        name: "my-project",
        description: "This is my project.",
        brand: {
            name: "My Company",
            country: "Pakistan",
            address: "House #22, Multan",
        },
    },
    transactions: {
        version: 1,
        transactions: [],
    },
})
    .override("main", (data) => {
    var _a, _b, _c, _d;
    // Check Configuration Version
    if (data.version !== 1)
        throw new Error(`Invalid configuration version! Currently installed CLI expects epic.config version 1.`);
    return Object.assign(Object.assign({}, data), { paths: {
            templates: ((_a = data.paths) === null || _a === void 0 ? void 0 : _a.templates) || "./src/templates/",
            contollers: ((_b = data.paths) === null || _b === void 0 ? void 0 : _b.contollers) || "./src/controllers/",
            middlewares: ((_c = data.paths) === null || _c === void 0 ? void 0 : _c.middlewares) || "./src/middlewares/",
            schemas: ((_d = data.paths) === null || _d === void 0 ? void 0 : _d.schemas) || "./src/schemas/",
        }, lastAccess: Object.assign({}, data.lastAccess) });
})
    .override("transactions", (data) => {
    // Check Transactions Version
    if (data.version !== 1)
        throw new Error(`Invalid transactions version! Currently installed CLI expects epic.transactions version 1.`);
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
                            // Execute Command
                            yield Command.method(Transaction.params, Command);
                        }
                    }),
                },
            ]).run();
        });
    }
}
exports.Core = Core;
