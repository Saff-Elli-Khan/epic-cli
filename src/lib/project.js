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
Project.create = () => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking Configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                if (!core_1.Core.getConfiguration(true))
                    yield execa_1.default("epic", ["init"]);
            }),
        },
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
                var _a, _b, _c, _d, _e, _f, _g, _h;
                if (fs_1.default.existsSync(Project.PackagePath)) {
                    // Get Configuration
                    const Configuration = core_1.Core.getConfiguration();
                    // Update Package Information
                    const Package = Project.getPackage();
                    Package.name = ((_a = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _a === void 0 ? void 0 : _a.name) || Package.name;
                    Package.description =
                        ((_b = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _b === void 0 ? void 0 : _b.description) || Package.description;
                    Package.brand = {
                        name: ((_d = (_c = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _c === void 0 ? void 0 : _c.brand) === null || _d === void 0 ? void 0 : _d.name) || Package.brand.name,
                        country: ((_f = (_e = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _e === void 0 ? void 0 : _e.brand) === null || _f === void 0 ? void 0 : _f.country) ||
                            Package.brand.country,
                        address: ((_h = (_g = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _g === void 0 ? void 0 : _g.brand) === null || _h === void 0 ? void 0 : _h.address) ||
                            Package.brand.address,
                    };
                    // Put Package Data
                    fs_1.default.writeFileSync(Project.PackagePath, JSON.stringify(Package, undefined, 2));
                    // Create Environment Directory
                    fs_1.default.mkdirSync(path_1.default.join(process.cwd(), "./env/"), {
                        recursive: true,
                    });
                    // Create Environment Files
                    ["development", "production"].forEach((env) => fs_1.default.writeFileSync(path_1.default.join(process.cwd(), `./env/.${env}.env`), `ENCRYPTION_KEY=${utils_1.generateRandomKey(32)}`));
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
                    `import { ${options.name} } from "../../database/${options.name}";\n` + // Add Schema Import
                        ctx.controllerContent
                            .replace(/(\/\*(\s*@(Temporary))\s*\*\/)\s*([^]*)\s*(\/\*(\s*\/\3)\s*\*\/)(\r\n|\r|\n)*/g, "") // Remove Temporary Code
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
                        ParentControllerContent =
                            `import { ${options.name + "Controller"} } from "./${options.name}";\n` + // Add Schema Import
                                ParentControllerContent.replace(new RegExp("(\\/\\*(\\s*@(" +
                                    options.parent +
                                    "ControllerChilds))\\s*\\*\\/)\\s*([^]*)\\s*(\\/\\*(\\s*\\/\\3)\\s*\\*\\/)(\\r\\n|\\r|\\n)*"), (_, ...args) => {
                                    // Parse Controllers List
                                    const ControllersList = (args[3] || "[]")
                                        .replace(/\[([^]*)\]/g, "$1")
                                        .replace(/\n*\s+/g, " ")
                                        .replace(/^\s*|\s*,\s*$/g, "");
                                    return `/* @${options.parent}ControllerChilds */ [${ControllersList ? ControllersList + ", " : ""}${options.name + "Controller"}] /* /${options.parent}ControllerChilds */`;
                                });
                        // Save Parent Controller Content
                        fs_1.default.writeFileSync(ParentControllerPath, ParentControllerContent);
                    }
                    catch (e) {
                        cli_1.EpicCli.Logger.warn("We are unable to parse controllers/index properly! Please add the child controller manually.").log();
                    }
                }
                // Get Configuration
                const Configuration = core_1.Core.getConfiguration();
                // Update Transactions
                Configuration.transactions.push({
                    command: command.name,
                    params: options,
                });
                // Set Transactions
                core_1.Core.setConfiguration(Configuration);
            },
        },
    ]).run();
});
