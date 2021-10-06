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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const execa_1 = __importDefault(require("execa"));
const listr_1 = __importDefault(require("listr"));
const core_1 = require("./core");
const utils_1 = require("./utils");
const epic_parser_1 = require("@saffellikhan/epic-parser");
class Project {
    static PackagePath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, "./package.json");
    }
    static EnvironmentsPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, "./env/");
    }
    static AppPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, "./src/");
    }
    static SamplesPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.templates);
    }
    static ControllersPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.contollers);
    }
    static SchemasPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.schemas);
    }
    static MiddlewaresPath() {
        return path_1.default.join(core_1.ConfigManager.Options.rootPath, core_1.ConfigManager.getConfig("main").paths.middlewares);
    }
    static getPackage() {
        return require(Project.PackagePath());
    }
    static configure(Configuration) {
        // Get Package Information
        const Package = Project.getPackage();
        // Update Package Information
        Package.name = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.name) || Package.name;
        Package.description = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.description) || Package.description;
        Package.private = (Configuration === null || Configuration === void 0 ? void 0 : Configuration.type) === "Application";
        Package.dependencies = Object.assign(Object.assign({}, Package.dependencies), { "@saffellikhan/epic-cli": `^${require("../../package.json").version}` });
        if ((Configuration === null || Configuration === void 0 ? void 0 : Configuration.type) === "Plugin") {
            // Remove Git Information
            Package.homepage = undefined;
            Package.repository = undefined;
            Package.bugs = undefined;
            // Dependencies to Development
            Package.devDependencies = Object.assign(Object.assign({}, Package.dependencies), Package.devDependencies);
            // Empty Dependencies
            Package.dependencies = {};
            // Update Tags
            Package.keywords = ["epic", "plugin"];
        }
        // Put Package Data
        fs_1.default.writeFileSync(Project.PackagePath(), JSON.stringify(Package, undefined, 2));
        // Re-Create Configuration
        core_1.ConfigManager.setConfig("main", Configuration);
        // Create Environment Directory
        fs_1.default.mkdirSync(Project.EnvironmentsPath(), {
            recursive: true,
        });
    }
    static initialize(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Creating or Updating configuration...",
                    task: () => {
                        // Set New Configuration
                        core_1.ConfigManager.setConfig("main", {
                            type: options.type,
                            name: options.name,
                            description: options.description,
                            brand: {
                                name: options.brandName,
                                country: options.brandCountry,
                                address: options.brandAddress,
                            },
                        });
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        if (fs_1.default.existsSync(Project.PackagePath()))
                            // Configure Project
                            Project.configure(core_1.ConfigManager.getConfig("main"));
                    },
                },
            ]).run();
        });
    }
    static create() {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: (ctx) => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            yield execa_1.default("epic", ["init", "--yes"]);
                        // Get Configuration
                        ctx.configuration = core_1.ConfigManager.getConfig("main");
                        // Remove Configuration
                        core_1.ConfigManager.delConfig("main");
                    }),
                },
                {
                    title: "Cloning repository to current directory",
                    task: ({ configuration }) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            // Clone Repository
                            yield execa_1.default("git", [
                                "clone",
                                "https://github.com/Saff-Elli-Khan/epic-application",
                                ".",
                            ]);
                            // Remove .git folder
                            yield execa_1.default("npx", ["rimraf", "./.git"]);
                            // Initialize New Repository
                            yield execa_1.default("git", ["init"]);
                        }
                        catch (error) {
                            // Configure Project
                            Project.configure(configuration);
                            // Throw Git Error
                            throw error;
                        }
                    }),
                },
                {
                    title: "Configuring your project",
                    task: ({ configuration }) => {
                        if (fs_1.default.existsSync(Project.PackagePath())) {
                            // Configure Project
                            Project.configure(configuration);
                            // Create Environment Files
                            ["development", "production"].forEach((env) => fs_1.default.writeFileSync(path_1.default.join(Project.EnvironmentsPath(), `./.${env}.env`), `ENCRYPTION_KEY=${utils_1.generateRandomKey(32)}`));
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
        });
    }
    static createController(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            throw new Error("Please initialize a project first!");
                    }),
                },
                {
                    title: "Creating new Controller",
                    task: () => {
                        // Parse Template
                        const Parsed = new epic_parser_1.TemplateParser({
                            inDir: options.templateDir ||
                                path_1.default.join(Project.SamplesPath(), "./controller/"),
                            inFile: `./${options.template}.ts`,
                            outDir: Project.ControllersPath(),
                            outFile: `./${options.name}.ts`,
                        })
                            .parse()
                            .injections({
                            ControllerPrefix: options.prefix,
                        });
                        // Push Database Schema
                        if (options.template === "default")
                            Parsed.push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                                modules: [options.name],
                                location: path_1.default.relative(Project.ControllersPath(), path_1.default.join(Project.SchemasPath(), options.name)).replace(/\\/g, "/"),
                            });
                        // Render Controller Content
                        Parsed.render((_) => _.replace(/@AppPath/g, path_1.default.relative(Project.ControllersPath(), Project.AppPath()).replace(/\\/g, "/")) // Add App Path
                            .replace(/Sample/g, options.name) // Add Name
                        );
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Get Parent Controller Content & Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: options.parent === "None"
                                    ? Project.AppPath()
                                    : Project.ControllersPath(),
                                inFile: `./${options.parent === "None" ? "App.controllers" : options.parent}.ts`,
                                outFile: `./${options.parent === "None" ? "App.controllers" : options.parent}.ts`,
                            })
                                .parse()
                                .push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                                modules: [options.name + "Controller"],
                                location: `./${path_1.default.relative(options.parent === "None"
                                    ? Project.AppPath()
                                    : Project.ControllersPath(), path_1.default.join(Project.ControllersPath(), options.name)).replace(/\\/g, "/")}`,
                            })
                                .push("ControllerChildsContainer", "ControllerChildTemplate", options.name + "ControllerChilds", {
                                child: options.name + "Controller",
                            })
                                .render();
                        }
                        catch (error) {
                            console.warn("We are unable to parse App.controllers properly! Please add the child controller manually.", error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("main", (_) => {
                            _.lastAccess.controller = options.name;
                            return _;
                        })
                            .setConfig("transactions", (_) => {
                            // Remove Duplicate Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-controller" &&
                                transaction.params.name === options.name));
                            // Add New Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        })
                            .setConfig("resources", (_) => {
                            // Remove Duplicate Resource
                            _.resources = _.resources.filter((resource) => !(resource.type === "controller" &&
                                resource.name === options.name));
                            // Add New Resource
                            _.resources.push({
                                type: "controller",
                                name: options.name,
                                parent: options.parent,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static createSchema(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            throw new Error("Please initialize a project first!");
                    }),
                },
                {
                    title: "Creating new Schema",
                    task: () => {
                        // Parse Template
                        new epic_parser_1.TemplateParser({
                            inDir: options.templateDir ||
                                path_1.default.join(Project.SamplesPath(), "./schema/"),
                            inFile: `./${options.template}.ts`,
                            outDir: Project.SchemasPath(),
                            outFile: `./${options.name}.ts`,
                        })
                            .parse()
                            .render((_) => _.replace(/@AppPath/g, path_1.default.relative(Project.SchemasPath(), Project.AppPath()).replace(/\\/g, "/")) // Add App Path
                            .replace(/Sample/g, options.name) // Add Name
                        );
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template App.database.ts
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./App.database.ts`,
                                outFile: `./App.database.ts`,
                            })
                                .parse()
                                .push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                                modules: [options.name],
                                location: `./${path_1.default.relative(Project.AppPath(), path_1.default.join(Project.SchemasPath(), options.name)).replace(/\\/g, "/")}`,
                            })
                                .push("SchemaListContainer", "SchemaListTemplate", options.name + "Schema", {
                                schema: options.name,
                            })
                                .render();
                        }
                        catch (error) {
                            console.warn("We are unable to parse App.database properly! Please add the schema to the list manually.", error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("main", (_) => {
                            _.lastAccess.schema = options.name;
                            return _;
                        })
                            .setConfig("transactions", (_) => {
                            // Remove Duplicate Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-schema" &&
                                transaction.params.name === options.name));
                            // Add New Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        })
                            .setConfig("resources", (_) => {
                            // Remove Duplicate Resource
                            _.resources = _.resources.filter((resource) => !(resource.type === "schema" && resource.name === options.name));
                            // Add New Resource
                            _.resources.push({
                                type: "schema",
                                name: options.name,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static deleteSchema(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            throw new Error("Please initialize a project first!");
                    }),
                },
                {
                    title: "Deleting the Schema",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Delete Schema
                        fs_1.default.unlinkSync(path_1.default.join(Project.SchemasPath(), `./${options.name}.ts`));
                    }),
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./App.database.ts`,
                                outFile: `./App.database.ts`,
                            })
                                .parse()
                                .pop("ImportsContainer", options.name + "Import")
                                .pop("SchemaListContainer", options.name + "Schema")
                                .render();
                        }
                        catch (error) {
                            console.warn(`We are unable to parse App.database properly! Please remove the schema from App.database manually.`, error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("main", (_) => {
                            _.lastAccess.schema = options.name;
                            return _;
                        })
                            .setConfig("transactions", (_) => {
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-schema" &&
                                transaction.params.name === options.name));
                            return _;
                        })
                            .setConfig("resources", (_) => {
                            _.resources = _.resources.filter((resource) => !(resource.type === "schema" && resource.name === options.name));
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static createSchemaColumn(options, command) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            throw new Error("Please initialize a project first!");
                    }),
                },
                {
                    title: "Creating the Schema Column",
                    task: () => {
                        var _a, _b, _c;
                        // Parse Template
                        const Parsed = new epic_parser_1.TemplateParser({
                            inDir: Project.SchemasPath(),
                            inFile: `./${options.schema}.ts`,
                            outFile: `./${options.schema}.ts`,
                        }).parse();
                        // Push Relation Import
                        if (options.relation)
                            Parsed.push("ImportsContainer", "ImportsTemplate", options.relation + "Import", {
                                modules: [options.relation],
                                location: `./${options.relation}`,
                            });
                        // Push Column
                        Parsed.push("ColumnsContainer", options.relation
                            ? options.arrayof === "Relation"
                                ? "ManyRelationTemplate"
                                : "OneRelationTemplate"
                            : "ColumnTemplate", options.name + "Column", {
                            name: options.name,
                            datatype: options.type === "Array"
                                ? `Array<${options.arrayof === "Record"
                                    ? `Record<string, ${options.recordType || "any"}>`
                                    : (_a = options.arrayof) === null || _a === void 0 ? void 0 : _a.toLowerCase()}>`
                                : options.type === "Enum"
                                    ? `"${(_b = options.choices) === null || _b === void 0 ? void 0 : _b.join('" | "')}"`
                                    : options.type === "Record"
                                        ? `Record<string, ${options.recordType || "any"}>`
                                        : options.type.toLowerCase(),
                            options: `{${options.length !== undefined && options.length !== 50
                                ? `\nlength: ${options.length || null},`
                                : ""}${options.collation !== undefined &&
                                options.collation !== "utf8mb4_unicode_ci"
                                ? `\ncollation: "${options.collation}",`
                                : ""}${options.choices
                                ? `\nchoices: ["${options.choices.join('", "')}"],`
                                : ""}${options.nullable ? `\nnullable: true,` : ""}${((_c = options.index) === null || _c === void 0 ? void 0 : _c.length)
                                ? `\nindex: ["${options.index.join('", "')}"],`
                                : ""}${options.defaultValue
                                ? `\ndefaultValue: ${options.defaultValue},`
                                : ""}${options.onUpdate ? `\nonUpdate: ${options.onUpdate},` : ""}\n}`,
                            schema: options.schema,
                            relation: options.relation,
                            mapping: JSON.stringify(options.mapping),
                        }).render();
                    },
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("main", (_) => {
                            _.lastAccess.schema = options.schema;
                            return _;
                        }).setConfig("transactions", (_) => {
                            // Remove Duplicate Transaction
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-schema-column" &&
                                transaction.params.schema === options.schema &&
                                transaction.params.name === options.name));
                            // Add New Transaction
                            _.transactions.push({
                                command: command.name,
                                params: options,
                            });
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
    static deleteMiddleware(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Queue the Tasks
            yield new listr_1.default([
                {
                    title: "Checking configuration...",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Check Configuration File
                        if (!core_1.ConfigManager.hasConfig("main"))
                            throw new Error("Please initialize a project first!");
                    }),
                },
                {
                    title: "Deleting the Middlware",
                    task: () => __awaiter(this, void 0, void 0, function* () {
                        // Delete Middleware
                        fs_1.default.unlinkSync(path_1.default.join(Project.MiddlewaresPath(), `./${options.name}.ts`));
                    }),
                },
                {
                    title: "Configuring your project",
                    task: () => {
                        try {
                            // Parse Template
                            new epic_parser_1.TemplateParser({
                                inDir: Project.AppPath(),
                                inFile: `./App.middleware.ts`,
                                outFile: `./App.middleware.ts`,
                            })
                                .parse()
                                .pop("ImportsContainer", options.name + "Import")
                                .pop("MiddlewaresContainer", options.name + "Middleware")
                                .render();
                        }
                        catch (error) {
                            console.warn(`We are unable to parse App.middleware properly! Please remove the schema from App.middleware manually.`, error);
                        }
                        // Update Configuration & Transactions
                        core_1.ConfigManager.setConfig("main", (_) => {
                            _.lastAccess.middleware = options.name;
                            return _;
                        })
                            .setConfig("transactions", (_) => {
                            _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-middleware" &&
                                transaction.params.name === options.name));
                            return _;
                        })
                            .setConfig("resources", (_) => {
                            _.resources = _.resources.filter((resource) => !(resource.type === "middleware" &&
                                resource.name === options.name));
                            return _;
                        });
                    },
                },
            ]).run();
        });
    }
}
exports.Project = Project;
Project.deleteController = (options) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!core_1.ConfigManager.hasConfig("main"))
                    throw new Error("Please initialize a project first!");
            }),
        },
        {
            title: "Deleting the Controller",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Delete Controller
                fs_1.default.unlinkSync(path_1.default.join(Project.ControllersPath(), `./${options.name}.ts`));
            }),
        },
        {
            title: "Configuring your project",
            task: () => {
                // Find & Undo (create-controller) Transaction related to this Controller
                const Transaction = core_1.ConfigManager.getConfig("transactions").transactions.reduce((result, transaction) => result
                    ? result
                    : transaction.command === "create-controller" &&
                        transaction.params.name === options.name
                        ? transaction
                        : null, null);
                // If Transaction Exists
                if (Transaction && typeof Transaction.params.parent === "string") {
                    try {
                        // Get Parent Controller Content & Parse Template
                        new epic_parser_1.TemplateParser({
                            inDir: Transaction.params.parent === "None"
                                ? Project.AppPath()
                                : Project.ControllersPath(),
                            inFile: `./${Transaction.params.parent === "None"
                                ? "App.controllers"
                                : Transaction.params.parent}.ts`,
                            outFile: `./${Transaction.params.parent === "None"
                                ? "App.controllers"
                                : Transaction.params.parent}.ts`,
                        })
                            .parse()
                            .pop("ImportsContainer", options.name + "Import")
                            .pop("ControllerChildsContainer", options.name + "ControllerChilds")
                            .render();
                    }
                    catch (error) {
                        console.warn(`We are unable to parse parent controller properly! Please remove the child controller from "${Transaction.params.parent}" controller manually.`, error);
                    }
                }
                // Update Configuration & Transactions
                core_1.ConfigManager.setConfig("main", (_) => {
                    _.lastAccess.controller = options.name;
                    return _;
                })
                    .setConfig("transactions", (_) => {
                    _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-controller" &&
                        transaction.params.name === options.name));
                    return _;
                })
                    .setConfig("resources", (_) => {
                    _.resources = _.resources.filter((resource) => !(resource.type === "controller" &&
                        resource.name === options.name));
                    return _;
                });
            },
        },
    ]).run();
});
Project.deleteSchemaColumn = (options) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!core_1.ConfigManager.hasConfig("main"))
                    throw new Error("Please initialize a project first!");
            }),
        },
        {
            title: "Deleting the Column",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Parse Template
                const Parsed = new epic_parser_1.TemplateParser({
                    inDir: Project.SchemasPath(),
                    inFile: `./${options.schema}.ts`,
                    outFile: `./${options.schema}.ts`,
                })
                    .parse()
                    .pop("ColumnsContainer", options.name + "Column");
                // Find & Undo (create-schema) Transaction related to this Schema
                const Transaction = core_1.ConfigManager.getConfig("transactions").transactions.reduce((result, transaction) => result
                    ? result
                    : transaction.command === "create-schema-column" &&
                        transaction.params.schema === options.schema &&
                        transaction.params.name === options.name
                        ? transaction
                        : null, null);
                // Pop Relation Import
                if (Transaction && typeof Transaction.params.relation === "string")
                    Parsed.pop("ImportsContainer", Transaction.params.relation + "Import");
                Parsed.render();
            }),
        },
        {
            title: "Configuring your project",
            task: () => {
                // Update Configuration & Transactions
                core_1.ConfigManager.setConfig("main", (_) => {
                    _.lastAccess.schema = options.name;
                    return _;
                }).setConfig("transactions", (_) => {
                    _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-schema-column" &&
                        transaction.params.schema === options.schema &&
                        transaction.params.name === options.name));
                    return _;
                });
            },
        },
    ]).run();
});
Project.createMiddleware = (options, command) => __awaiter(void 0, void 0, void 0, function* () {
    // Queue the Tasks
    yield new listr_1.default([
        {
            title: "Checking configuration...",
            task: () => __awaiter(void 0, void 0, void 0, function* () {
                // Check Configuration File
                if (!core_1.ConfigManager.hasConfig("main"))
                    throw new Error("Please initialize a project first!");
            }),
        },
        {
            title: "Creating new Middleware",
            task: () => {
                // Parse Template
                new epic_parser_1.TemplateParser({
                    inDir: options.templateDir ||
                        path_1.default.join(Project.SamplesPath(), "./middleware/"),
                    inFile: `./${options.template}.ts`,
                    outDir: Project.MiddlewaresPath(),
                    outFile: `./${options.name}.ts`,
                })
                    .parse()
                    .render((_) => _.replace(/@AppPath/g, path_1.default.relative(Project.MiddlewaresPath(), Project.AppPath()).replace(/\\/g, "/")) // Add App Path
                    .replace(/Sample/g, options.name) // Add Name
                );
            },
        },
        {
            title: "Configuring your project",
            task: () => {
                try {
                    // Parse Template
                    new epic_parser_1.TemplateParser({
                        inDir: Project.AppPath(),
                        inFile: `./App.middlewares.ts`,
                        outFile: `./App.middlewares.ts`,
                    })
                        .parse()
                        .push("ImportsContainer", "ImportsTemplate", options.name + "Import", {
                        modules: [options.name + "Middleware"],
                        location: `./${path_1.default.relative(Project.AppPath(), path_1.default.join(Project.MiddlewaresPath(), options.name)).replace(/\\/g, "/")}`,
                    })
                        .push("MiddlewaresContainer", "MiddlewareTemplate", options.name + "Middleware", {
                        middleware: options.name + "Middleware",
                    })
                        .render();
                }
                catch (error) {
                    console.warn("We are unable to parse App.middlewares properly! Please add the child controller manually.", error);
                }
                // Update Configuration & Transactions
                core_1.ConfigManager.setConfig("main", (_) => {
                    _.lastAccess.middleware = options.name;
                    return _;
                })
                    .setConfig("transactions", (_) => {
                    // Remove Duplicate Transaction
                    _.transactions = _.transactions.filter((transaction) => !(transaction.command === "create-middleware" &&
                        transaction.params.name === options.name));
                    // Add New Transaction
                    _.transactions.push({
                        command: command.name,
                        params: options,
                    });
                    return _;
                })
                    .setConfig("resources", (_) => {
                    // Remove Duplicate Resource
                    _.resources = _.resources.filter((resource) => !(resource.type === "middleware" &&
                        resource.name === options.name));
                    // Add New Resource
                    _.resources.push({
                        type: "middleware",
                        name: options.name,
                    });
                    return _;
                });
            },
        },
    ]).run();
});
