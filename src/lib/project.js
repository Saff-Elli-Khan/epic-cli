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
const execa_1 = __importDefault(require("execa"));
const listr_1 = __importDefault(require("listr"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./utils");
const core_1 = require("./core");
const cli_1 = require("../cli");
class Project {
}
exports.Project = Project;
Project.PackagePath = path_1.default.join(process.cwd(), "./package.json");
Project.SamplesPath = path_1.default.join(core_1.Core.AppPath, "./samples/");
Project.getPackage = () => require(Project.PackagePath);
Project.create = (options) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Cloning repository to current directory",
            task: () => execa_1.default("git", [
                "clone",
                "https://github.com/Saff-Elli-Khan/epic-application",
                ".",
            ]),
        },
        {
            title: "Configuring your project",
            task: () => {
                if (fs_1.default.existsSync(Project.PackagePath)) {
                    // Update Package Information
                    Project.getPackage().name = options.name;
                    Project.getPackage().description = options.description;
                    Project.getPackage().brand = {
                        name: options.brandName,
                        country: options.brandCountry,
                        address: options.brandAddress,
                    };
                    // Put Package Data
                    fs_1.default.writeFileSync(Project.PackagePath, JSON.stringify(Project.getPackage(), undefined, 2));
                    // Create Environment Directory
                    fs_1.default.mkdirSync(path_1.default.join(process.cwd(), "./env/"), {
                        recursive: true,
                    });
                    // Create Environment Files
                    ["development", "production"].forEach((env) => fs_1.default.writeFileSync(path_1.default.join(process.cwd(), `./env/.${env}.env`), `ENCRYPTION_KEY=${utils_1.generateRandomKey(32)}`));
                    // Create Epic Configuration File
                    core_1.Core.setConfiguration(core_1.Core.DefaultConfig);
                    // Create Epic Transactions File
                    core_1.Core.setTransactions(core_1.Core.DefaultTransactions);
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
    return true;
});
Project.createController = (options, command) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Loading controller sample",
            task: (ctx) => {
                // Load Controller Sample
                ctx.controllerContent = fs_1.default.readFileSync(path_1.default.join(options.sampleDir || Project.SamplesPath, `./controller/${options.template}.ts`)).toString();
            },
        },
        {
            title: "Preparing the Controller",
            task: (ctx) => {
                // Update Controller Sample
                ctx.controllerContent =
                    `import { ${options.name} } from "../../database/${options.name}"\n` + // Add Schema Import
                        ctx.controllerContent
                            .replace(/\n?(\/\*(\s*@(Temporary))\s*\*\/)\s*([^]*)\s*(\/\*(\s*\/\3)\s*\*\/)\n?/g, "") // Remove Temporary Code
                            .replace("{ControllerPrefix}", options.prefix) // Add Controler Prefix
                            .replace(/Sample/g, options.name); // Add Name
                // Update Controller Scope
                if (options.scope === "Child")
                    ctx.controllerContent.replace("Controller", "ChildController");
            },
        },
        {
            title: "Creating New Controller",
            task: ({ controllerContent }) => {
                const ControllerDir = path_1.default.join(core_1.Core.AppPath, `./controllers/v${options.version}/`);
                // Resolve Directory
                fs_1.default.mkdirSync(ControllerDir, { recursive: true });
                // Create Controller
                fs_1.default.writeFileSync(path_1.default.join(ControllerDir, `./${options.name}.ts`), controllerContent);
            },
        },
        {
            title: "Configuring your project",
            task: () => {
                if (options.scope === "Child") {
                    try {
                        // Parent Controller Path
                        const ParentControllerPath = path_1.default.join(core_1.Core.AppPath, `./controllers/v${options.version}/${options.parent}.ts`);
                        // Get Parent Controller Content
                        let ParentControllerContent = fs_1.default.readFileSync(ParentControllerPath).toString();
                        // Modify Parent Controller Content
                        ParentControllerContent = ParentControllerContent.replace(new RegExp(`\n?(\/\*(\s*@(${options.parent}ControllerChilds))\s*\*\/)\s*([^]*)\s*(\/\*(\s*\/\3)\s*\*\/)\n?`), (_, ...args) => {
                            // Parse Controllers List
                            const ControllersList = JSON.parse(args[3] || []).join(", ");
                            return `/* @${options.parent}ControllerChilds */ [${ControllersList}, ${options.name + "Controller"}] /* /${options.parent}ControllerChilds */`;
                        });
                        // Save Parent Controller Content
                        fs_1.default.writeFileSync(ParentControllerPath, ParentControllerContent);
                    }
                    catch (e) {
                        cli_1.EpicCli.Logger.warn("We are unable to parse controllers/index properly! Please add the child controller manually.").log();
                    }
                }
                // Get Transactions
                const Transactions = core_1.Core.getTransactions();
                // Update Transactions
                Transactions.data.push({
                    command: command.name,
                    params: options,
                });
                // Set Transactions
                core_1.Core.setTransactions(Transactions);
            },
        },
    ]).run();
});
