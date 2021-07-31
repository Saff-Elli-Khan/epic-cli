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
const epic_parser_1 = require("@saffellikhan/epic-parser");
class Project {
}
exports.Project = Project;
Project.PackagePath = path_1.default.join(core_1.Core.RootPath, "./package.json");
Project.EnvironmentsPath = path_1.default.join(core_1.Core.RootPath, "./env/");
Project.AppPath = path_1.default.join(core_1.Core.RootPath, "./src/");
Project.SamplesPath = path_1.default.join(core_1.Core.RootPath, core_1.Core.getConfiguration().paths.samples);
Project.ControllersPath = path_1.default.join(core_1.Core.RootPath, core_1.Core.getConfiguration().paths.contollers);
Project.SchemasPath = path_1.default.join(core_1.Core.RootPath, core_1.Core.getConfiguration().paths.schemas);
Project.getPackage = () => require(Project.PackagePath);
Project.configure = (Configuration) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // Update Package Information
    const Package = Project.getPackage();
    Package.name = ((_a = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _a === void 0 ? void 0 : _a.name) || Package.name;
    Package.description =
        ((_b = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _b === void 0 ? void 0 : _b.description) || Package.description;
    Package.brand = {
        name: ((_d = (_c = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _c === void 0 ? void 0 : _c.brand) === null || _d === void 0 ? void 0 : _d.name) || Package.brand.name,
        country: ((_f = (_e = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _e === void 0 ? void 0 : _e.brand) === null || _f === void 0 ? void 0 : _f.country) || Package.brand.country,
        address: ((_h = (_g = Configuration === null || Configuration === void 0 ? void 0 : Configuration.application) === null || _g === void 0 ? void 0 : _g.brand) === null || _h === void 0 ? void 0 : _h.address) || Package.brand.address,
    };
    // Put Package Data
    fs_1.default.writeFileSync(Project.PackagePath, JSON.stringify(Package, undefined, 2));
    // Re-Create Configuration
    core_1.Core.setConfiguration(Configuration);
    // Create Environment Directory
    fs_1.default.mkdirSync(Project.EnvironmentsPath, {
        recursive: true,
    });
};
Project.create = () => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: (ctx) => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!core_1.Core.getConfiguration(true))
                    yield execa_1.default("epic", ["init", "--yes"]);
                // Get Configuration
                ctx.configuration = core_1.Core.getConfiguration();
                // Remove Configuration
                core_1.Core.removeConfiguration();
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
            task: ({ configuration }) => {
                if (fs_1.default.existsSync(Project.PackagePath)) {
                    // Configure Project
                    Project.configure(configuration);
                    // Create Environment Files
                    ["development", "production"].forEach((env) => fs_1.default.writeFileSync(path_1.default.join(Project.EnvironmentsPath, `./.${env}.env`), `ENCRYPTION_KEY=${utils_1.generateRandomKey(32)}`));
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
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                // Check Configuration File
                if (!fs_1.default.readdirSync(core_1.Core.RootPath).length)
                    throw new Error("Please initialize a project first!");
                else if ((_a = core_1.Core.getConfiguration()) === null || _a === void 0 ? void 0 : _a.transactions.reduce((exists, transaction) => exists
                    ? exists
                    : transaction.command === "create-controller" &&
                        transaction.params.name === options.name, false))
                    throw new Error("Controller already exists!");
            }),
        },
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
                // Create Relative Path to Schemas
                const SchemaPath = path_1.default.relative(Project.ControllersPath, path_1.default.join(Project.SchemasPath, options.name)).replace(/\\/g, "/");
                // Create Relative Path To App
                const AppPath = path_1.default.relative(Project.ControllersPath, Project.AppPath).replace(/\\/g, "/");
                // Parse Template
                const Parsed = new epic_parser_1.Parser(ctx.controllerContent
                    .replace(/@AppPath/g, AppPath) // Add App Path
                    .replace("{ControllerPrefix}", options.prefix) // Add Controler Prefix
                    .replace(/Sample/g, options.name) // Add Name
                ).parse();
                // Push Import
                Parsed.push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                    modules: [options.name],
                    location: SchemaPath,
                });
                // Update Controller Sample
                ctx.controllerContent = Parsed.render();
            },
        },
        {
            title: "Creating New Controller",
            task: ({ controllerContent }) => {
                // Resolve Directory
                fs_1.default.mkdirSync(Project.ControllersPath, { recursive: true });
                // Create Controller
                fs_1.default.writeFileSync(path_1.default.join(Project.ControllersPath, `./${options.name}.ts`), controllerContent);
            },
        },
        {
            title: "Configuring your project",
            task: () => {
                try {
                    // Parent Controller Path
                    const ParentControllerPath = path_1.default.join(Project.ControllersPath, `./${options.parent}.ts`);
                    // Get Parent Controller Content & Parse Template
                    const Parsed = new epic_parser_1.Parser(fs_1.default.readFileSync(ParentControllerPath).toString()).parse();
                    // Push Import
                    Parsed.push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                        modules: [options.name + "Controller"],
                        location: `./${options.name}`,
                    });
                    // Push Child Controller
                    Parsed.push("ControllerChildsContainer", "ControllerChildsListTemplate", options.parent + "ControllerChilds", (content) => {
                        // Parse Controllers List
                        const ControllersList = (content || "[]")
                            .replace(/\[([^]*)\]\s*,\s*/g, "$1")
                            .split(/\s*,\s*/g)
                            .filter((v) => v);
                        // Push New Controller
                        ControllersList.push(options.name + "Controller");
                        return {
                            childs: ControllersList,
                        };
                    });
                    // Save Parent Controller Content
                    fs_1.default.writeFileSync(ParentControllerPath, Parsed.render());
                }
                catch (e) {
                    cli_1.EpicCli.Logger.warn("We are unable to parse controllers/index properly! Please add the child controller manually.").log();
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
Project.deleteController = (options) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!fs_1.default.readdirSync(core_1.Core.RootPath).length)
                    throw new Error("Please initialize a project first!");
            }),
        },
        {
            title: "Deleting the controller",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Delete Controller
                fs_1.default.unlinkSync(path_1.default.join(Project.ControllersPath, `./${options.name}.ts`));
            }),
        },
        {
            title: "Configuring your project",
            task: () => {
                // Get Configuration
                const Configuration = core_1.Core.getConfiguration();
                // Find Create Controller Transaction related to this Controller
                const Transaction = Configuration.transactions.reduce((result, transaction) => result
                    ? result
                    : transaction.command === "create-controller" &&
                        transaction.params.name === options.name
                        ? transaction
                        : null, null);
                // If Transaction Exists
                if (Transaction) {
                    try {
                        // Parent Controller Path
                        const ParentControllerPath = path_1.default.join(Project.ControllersPath, `./${Transaction.params.parent}.ts`);
                        // Get Parent Controller Content & Parse Template
                        const Parsed = new epic_parser_1.Parser(fs_1.default.readFileSync(ParentControllerPath)
                            .toString()
                            .replace(new RegExp("\\s*(" + options.name + "Controller)\\s*,?\\s*", "g"), "")).parse();
                        // Remove Child Controller Import
                        Parsed.pop("ImportsContainer", options.name + "Import");
                        // Save Parent Controller Content
                        fs_1.default.writeFileSync(ParentControllerPath, Parsed.render());
                    }
                    catch (e) {
                        cli_1.EpicCli.Logger.warn(`We are unable to parse controllers/index properly! Please remove the child controller from "${Transaction.params.parent}" manually.`).log();
                    }
                }
                // Remove Transaction
                Configuration.transactions = Configuration.transactions.filter((transaction) => !(transaction.command === "create-controller" &&
                    transaction.params.name === options.name));
                // Set Transactions
                core_1.Core.setConfiguration(Configuration);
            },
        },
    ]).run();
});
Project.createSchema = (options, command) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                var _b;
                // Check Configuration File
                if (!fs_1.default.readdirSync(core_1.Core.RootPath).length)
                    throw new Error("Please initialize a project first!");
                else if ((_b = core_1.Core.getConfiguration()) === null || _b === void 0 ? void 0 : _b.transactions.reduce((exists, transaction) => exists
                    ? exists
                    : transaction.command === "create-schema" &&
                        transaction.params.name === options.name, false))
                    throw new Error("Schema already exists!");
            }),
        },
        {
            title: "Loading schema sample",
            task: (ctx) => {
                // Load Schema Sample
                ctx.schemaContent = fs_1.default.readFileSync(path_1.default.join(options.sampleDir || Project.SamplesPath, `./schema/${options.template}.ts`)).toString();
            },
        },
        {
            title: "Preparing the Schema",
            task: (ctx) => {
                // Create Relative Path To App
                const AppPath = path_1.default.relative(Project.SchemasPath, Project.AppPath).replace(/\\/g, "/");
                // Parse Template
                const Parsed = new epic_parser_1.Parser(ctx.schemaContent
                    .replace(/@AppPath/g, AppPath) // Add App Path
                    .replace(/Sample/g, options.name) // Add Name
                ).parse();
                // Update Schema Sample
                ctx.schemaContent = Parsed.render();
            },
        },
        {
            title: "Creating New Schema",
            task: ({ schemaContent }) => {
                // Resolve Directory
                fs_1.default.mkdirSync(Project.SchemasPath, { recursive: true });
                // Create Schema
                fs_1.default.writeFileSync(path_1.default.join(Project.SchemasPath, `./${options.name}.ts`), schemaContent);
            },
        },
        {
            title: "Configuring your project",
            task: () => {
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
Project.deleteSchema = (options) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!fs_1.default.readdirSync(core_1.Core.RootPath).length)
                    throw new Error("Please initialize a project first!");
            }),
        },
        {
            title: "Deleting the schema",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Delete Schema
                fs_1.default.unlinkSync(path_1.default.join(Project.SchemasPath, `./${options.name}.ts`));
            }),
        },
        {
            title: "Configuring your project",
            task: () => {
                // Get Configuration
                const Configuration = core_1.Core.getConfiguration();
                // Remove Transaction
                Configuration.transactions = Configuration.transactions.filter((transaction) => !(transaction.command === "create-schema" &&
                    transaction.params.name === options.name));
                // Set Transactions
                core_1.Core.setConfiguration(Configuration);
            },
        },
    ]).run();
});
Project.createSchemaColumn = (options, command) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!fs_1.default.readdirSync(core_1.Core.RootPath).length)
                    throw new Error("Please initialize a project first!");
            }),
        },
        {
            title: "Loading schema",
            task: (ctx) => {
                // Load Schema Sample
                ctx.schemaContent = fs_1.default.readFileSync(path_1.default.join(Project.SchemasPath, `./${options.schema}.ts`)).toString();
            },
        },
        {
            title: "Preparing the Schema",
            task: (ctx) => {
                var _a, _b, _c;
                // Parse Template
                const Parsed = new epic_parser_1.Parser(ctx.schemaContent).parse();
                // Push Column
                Parsed.push("ColumnsContainer", options.relation
                    ? options.arrayof === "Relation"
                        ? "ManyRelationTemplate"
                        : "OneRelationTemplate"
                    : "ColumnTemplate", options.name + "Column", {
                    name: options.name,
                    datatype: options.type === "Array"
                        ? `Array<${options.arrayof === "Record"
                            ? "Record<string, any>"
                            : (_a = options.arrayof) === null || _a === void 0 ? void 0 : _a.toLowerCase()}>`
                        : options.type === "Enum"
                            ? (_b = options.choices) === null || _b === void 0 ? void 0 : _b.join(" | ")
                            : options.type === "Record"
                                ? "Record<string, any>"
                                : options.type.toLowerCase(),
                    options: `{${options.length !== undefined
                        ? `\nlength: ${options.length || null},`
                        : ""}${options.collation ? `\ncollation: "${options.collation}",` : ""}${options.choices ? `\nchoices: [${options.choices}],` : ""}${options.nullable !== undefined
                        ? `\nnullable: ${options.nullable},`
                        : ""}${((_c = options.index) === null || _c === void 0 ? void 0 : _c.length) ? `\nindex: [${options.index}]` : ""}${options.defaultValue
                        ? `\ndefaultValue: ${options.defaultValue},`
                        : ""}${options.onUpdate ? `\nonUpdate: ${options.onUpdate},` : ""}\n}`,
                    schema: options.schema,
                    relation: options.relation,
                    mapping: JSON.stringify(options.mapping),
                });
                // Updated Schema
                ctx.schemaContent = Parsed.render();
            },
        },
        {
            title: "Creating New Column",
            task: ({ schemaContent }) => {
                // Resolve Directory
                fs_1.default.mkdirSync(Project.SchemasPath, { recursive: true });
                // Create Schema
                fs_1.default.writeFileSync(path_1.default.join(Project.SchemasPath, `./${options.schema}.ts`), schemaContent);
            },
        },
        {
            title: "Configuring your project",
            task: () => {
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
