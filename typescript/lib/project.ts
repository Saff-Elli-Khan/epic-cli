import Path from "path";
import Fs from "fs";
import Execa from "execa";
import Listr from "listr";
import {
  ProjectType,
  ConfigManager,
  ConfigurationInterface,
  TransactionInterface,
  ResourcesInterface,
} from "./core";
import { generateRandomKey } from "./utils";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { TemplateParser } from "@saffellikhan/epic-parser";
import { ResourceInterface } from "..";

export interface InitializationOptions {
  type: ProjectType;
  name: string;
  description: string;
  brandName: string;
  brandCountry: string;
  brandAddress: string;
}

export interface CreateControllerOptions {
  name: string;
  description: string;
  prefix: string;
  template: string;
  parent: string;
  templateDir?: string;
}

export interface DeleteControllerOptions {
  name: string;
}

export interface CreateSchemaOptions {
  name: string;
  description: string;
  template: string;
  templateDir?: string;
}

export interface DeleteSchemaOptions {
  name: string;
}

export interface CreateSchemaColumnOptions {
  schema: string;
  type:
    | "String"
    | "Number"
    | "Boolean"
    | "Enum"
    | "Record"
    | "Array"
    | "Relation"
    | "Any";
  choices?: string[];
  arrayof?: "String" | "Number" | "Boolean" | "Record" | "Relation" | "Any";
  recordType?: string;
  length?: number;
  relation?: string;
  mapping?: string[];
  name: string;
  nullable?: boolean;
  defaultValue?: string;
  public?: boolean;
  collation?: string;
  index?: ("FULLTEXT" | "UNIQUE" | "INDEX" | "SPATIAL")[];
  onUpdate?: string;
}

export interface DeleteSchemaColumnOptions {
  schema: string;
  name: string;
}

export interface CreateMiddlewareOptions {
  name: string;
  description: string;
  template: string;
  templateDir?: string;
}

export interface DeleteMiddlewareOptions {
  name: string;
}

export interface AddPluginOptions {
  name: string;
}

export interface RemovePluginOptions {
  name: string;
}

export class Project {
  static PackagePath() {
    return Path.join(ConfigManager.Options.rootPath, "./package.json");
  }

  static EnvironmentsPath() {
    return Path.join(ConfigManager.Options.rootPath, "./env/");
  }

  static AppPath() {
    return Path.join(ConfigManager.Options.rootPath, "./src/");
  }

  static AppCore() {
    return Path.join(ConfigManager.Options.rootPath, "./src/core/");
  }

  static SamplesPath() {
    return Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.templates!
    );
  }

  static ControllersPath() {
    return Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.contollers!
    );
  }

  static SchemasPath() {
    return Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.schemas!
    );
  }

  static MiddlewaresPath() {
    return Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.middlewares!
    );
  }

  static getPackage() {
    return require(Project.PackagePath());
  }

  static configure(Configuration: ConfigurationInterface) {
    // Get Package Information
    const Package = Project.getPackage();

    // Update Package Information
    Package.name = Configuration?.name || Package.name;
    Package.description = Configuration?.description || Package.description;
    Package.private = Configuration?.type === "Application";
    Package.dependencies = {
      ...Package.dependencies,
      "@saffellikhan/epic-cli": `^${require("../../package.json").version}`,
    };

    if (Configuration?.type === "Plugin") {
      // Dependencies to Development
      Package.devDependencies = {
        ...Package.dependencies,
        ...Package.devDependencies,
      };

      // Empty Dependencies
      Package.dependencies = {};

      // Update Tags
      Package.keywords = ["epic", "plugin"];
    }

    // Put Package Data
    Fs.writeFileSync(
      Project.PackagePath(),
      JSON.stringify(Package, undefined, 2)
    );

    // Re-Create Configuration
    ConfigManager.setConfig("main", Configuration);

    // Create Environment Directory
    Fs.mkdirSync(Project.EnvironmentsPath(), {
      recursive: true,
    });
  }

  static async initialize(options: InitializationOptions) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating or Updating configuration...",
        task: () => {
          // Set New Configuration
          ConfigManager.setConfig("main", {
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
          if (Fs.existsSync(Project.PackagePath()))
            // Configure Project
            Project.configure(ConfigManager.getConfig("main"));
        },
      },
    ]).run();
  }

  static async create() {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking configuration...",
        task: async (ctx) => {
          // Check Configuration File
          if (!ConfigManager.hasConfig("main"))
            await Execa("epic", ["init", "--yes"]);

          // Get Configuration
          ctx.configuration = ConfigManager.getConfig("main");

          // Remove Configuration
          ConfigManager.delConfig("main");
        },
      },
      {
        title: "Cloning repository to current directory",
        task: async ({ configuration }) => {
          try {
            // Clone Repository
            await Execa("git", [
              "clone",
              "https://github.com/Saff-Elli-Khan/epic-application",
              ".",
            ]);

            // Remove .git folder
            await Execa("npx", ["rimraf", "./.git"]);

            // Initialize New Repository
            await Execa("git", ["init"]);
          } catch (error) {
            // Configure Project
            Project.configure(configuration);

            // Throw Git Error
            throw error;
          }
        },
      },
      {
        title: "Configuring your project",
        task: ({ configuration }) => {
          if (Fs.existsSync(Project.PackagePath())) {
            // Configure Project
            Project.configure(configuration);

            // Create Environment Files
            ["development", "production"].forEach((env) =>
              Fs.writeFileSync(
                Path.join(Project.EnvironmentsPath(), `./.${env}.env`),
                `ENCRYPTION_KEY=${generateRandomKey(32)}`
              )
            );
          } else
            throw new Error(
              `We did not found a 'package.json' in the project!`
            );
        },
      },
      {
        title: "Installing package dependencies with Yarn",
        task: (ctx, task) =>
          Execa("yarn")
            .then(() => {
              ConfigManager.setConfig("main", (_) => {
                // Set Package Manager
                _.packageManager = "yarn";

                return _;
              });
            })
            .catch(() => {
              ctx.yarn = false;

              task.skip(
                "Yarn not available, install it via `npm install -g yarn`"
              );
            }),
      },
      {
        title: "Installing package dependencies with npm",
        enabled: (ctx) => ctx.yarn === false,
        task: () =>
          Execa("npm", ["install"]).then(() => {
            ConfigManager.setConfig("main", (_) => {
              // Set Package Manager
              _.packageManager = "npm";

              return _;
            });
          }),
      },
    ]).run();
  }

  static async createController(
    options: CreateControllerOptions,
    command: CommandInterface
  ) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating new Controller",
        task: () => {
          // Parse Template
          const Parsed = new TemplateParser({
            inDir:
              options.templateDir ||
              Path.join(Project.SamplesPath(), "./controller/"),
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
            Parsed.push(
              "ImportsContainer",
              "ImportsTemplate",
              options.name + "SchemaImport",
              {
                modules: [options.name],
                location: Path.relative(
                  Project.ControllersPath(),
                  Path.join(Project.SchemasPath(), options.name)
                ).replace(/\\/g, "/"),
              }
            );

          // Render Controller Content
          Parsed.render((_) => _.replace(/Sample/g, options.name));
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Get Parent Controller Content & Parse Template
            new TemplateParser({
              inDir:
                options.parent === "None"
                  ? Project.AppPath()
                  : Project.ControllersPath(),
              inFile: `./${
                options.parent === "None" ? "core/controllers" : options.parent
              }.ts`,
              outFile: `./${
                options.parent === "None" ? "core/controllers" : options.parent
              }.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "ControllerImport",
                {
                  modules: [options.name + "Controller"],
                  location: `./${Path.relative(
                    options.parent === "None"
                      ? Project.AppCore()
                      : Project.ControllersPath(),
                    Path.join(Project.ControllersPath(), options.name)
                  ).replace(/\\/g, "/")}`,
                }
              )
              .push(
                "ControllerChildsContainer",
                "ControllerChildTemplate",
                options.name + "ControllerChilds",
                {
                  child: options.name + "Controller",
                }
              )
              .render();
          } catch (error) {
            console.warn(
              "We are unable to parse core/controllers properly! Please add the child controller manually.",
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            _.lastAccess!.controller = options.name;

            // Remove Duplicate Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-controller" &&
                  transaction.params.name === options.name
                )
            );

            // Add New Transaction
            _.transactions.push({
              command: command.name,
              params: options,
            });

            return _;
          }).setConfig("resources", (_) => {
            // Remove Duplicate Resource
            _.resources = _.resources.filter(
              (resource) =>
                !(
                  resource.type === "controller" &&
                  resource.name === options.name
                )
            );

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
  }

  static deleteController = async (options: DeleteControllerOptions) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Deleting the Controller",
        task: async () => {
          // Delete Controller
          Fs.unlinkSync(
            Path.join(Project.ControllersPath(), `./${options.name}.ts`)
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Find & Undo (create-controller) Transaction related to this Controller
          const Transaction = ConfigManager.getConfig(
            "transactions"
          ).transactions.reduce<TransactionInterface | null>(
            (result, transaction) =>
              result
                ? result
                : transaction.command === "create-controller" &&
                  transaction.params.name === options.name
                ? transaction
                : null,
            null
          );

          // If Transaction Exists
          if (Transaction && typeof Transaction.params.parent === "string") {
            try {
              // Get Parent Controller Content & Parse Template
              new TemplateParser({
                inDir:
                  Transaction.params.parent === "None"
                    ? Project.AppPath()
                    : Project.ControllersPath(),
                inFile: `./${
                  Transaction.params.parent === "None"
                    ? "core/controllers"
                    : Transaction.params.parent
                }.ts`,
                outFile: `./${
                  Transaction.params.parent === "None"
                    ? "core/controllers"
                    : Transaction.params.parent
                }.ts`,
              })
                .parse()
                .pop("ImportsContainer", options.name + "ControllerImport")
                .pop(
                  "ControllerChildsContainer",
                  options.name + "ControllerChilds"
                )
                .render();
            } catch (error) {
              console.warn(
                `We are unable to parse parent controller properly! Please remove the child controller from "${Transaction.params.parent}" controller manually.`,
                error
              );
            }
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            delete _.lastAccess!.controller;

            // Remove Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-controller" &&
                  transaction.params.name === options.name
                )
            );

            return _;
          }).setConfig("resources", (_) => {
            _.resources = _.resources.filter(
              (resource) =>
                !(
                  resource.type === "controller" &&
                  resource.name === options.name
                )
            );

            return _;
          });
        },
      },
    ]).run();
  };

  static async createSchema(
    options: CreateSchemaOptions,
    command: CommandInterface
  ) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating new Schema",
        task: () => {
          // Parse Template
          new TemplateParser({
            inDir:
              options.templateDir ||
              Path.join(Project.SamplesPath(), "./schema/"),
            inFile: `./${options.template}.ts`,
            outDir: Project.SchemasPath(),
            outFile: `./${options.name}.ts`,
          })
            .parse()
            .render((_) => _.replace(/Sample/g, options.name));
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parse Template core/database.ts
            new TemplateParser({
              inDir: Project.AppPath(),
              inFile: `./core/database.ts`,
              outFile: `./core/database.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "SchemaImport",
                {
                  modules: [options.name],
                  location: `./${Path.relative(
                    Project.AppCore(),
                    Path.join(Project.SchemasPath(), options.name)
                  ).replace(/\\/g, "/")}`,
                }
              )
              .push(
                "SchemaListContainer",
                "SchemaListTemplate",
                options.name + "Schema",
                {
                  schema: options.name,
                }
              )
              .render();
          } catch (error) {
            console.warn(
              "We are unable to parse core/database properly! Please add the schema to the list manually.",
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            _.lastAccess!.schema = options.name;

            // Remove Duplicate Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-schema" &&
                  transaction.params.name === options.name
                )
            );

            // Add New Transaction
            _.transactions.push({
              command: command.name,
              params: options,
            });

            return _;
          }).setConfig("resources", (_) => {
            // Remove Duplicate Resource
            _.resources = _.resources.filter(
              (resource) =>
                !(resource.type === "schema" && resource.name === options.name)
            );

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
  }

  static async deleteSchema(options: DeleteSchemaOptions) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Deleting the Schema",
        task: async () => {
          // Delete Schema
          Fs.unlinkSync(
            Path.join(Project.SchemasPath(), `./${options.name}.ts`)
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parse Template
            new TemplateParser({
              inDir: Project.AppPath(),
              inFile: `./core/database.ts`,
              outFile: `./core/database.ts`,
            })
              .parse()
              .pop("ImportsContainer", options.name + "SchemaImport")
              .pop("SchemaListContainer", options.name + "Schema")
              .render();
          } catch (error) {
            console.warn(
              `We are unable to parse core/database properly! Please remove the schema from core/database manually.`,
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            delete _.lastAccess!.schema;

            // Remove Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-schema" &&
                  transaction.params.name === options.name
                )
            );

            return _;
          }).setConfig("resources", (_) => {
            _.resources = _.resources.filter(
              (resource) =>
                !(resource.type === "schema" && resource.name === options.name)
            );

            return _;
          });
        },
      },
    ]).run();
  }

  static async createModule(
    options: CreateControllerOptions,
    command: CommandInterface
  ) {
    // Update Temporary Command Name
    command.name = "create-controller";

    // Create New Controller
    await Project.createController(options, command);

    // Update Temporary Command Name
    command.name = "create-schema";

    // Create New Schema
    await Project.createSchema(options, command);
  }

  static async deleteModule(options: DeleteControllerOptions) {
    await Project.deleteController(options);
    await Project.deleteSchema(options);
  }

  static async createSchemaColumn(
    options: CreateSchemaColumnOptions,
    command: CommandInterface
  ) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating the Schema Column",
        task: () => {
          // Parse Template
          const Parsed = new TemplateParser({
            inDir: Project.SchemasPath(),
            inFile: `./${options.schema}.ts`,
            outFile: `./${options.schema}.ts`,
          }).parse();

          // Push Relation Import
          if (options.relation)
            Parsed.push(
              "ImportsContainer",
              "ImportsTemplate",
              options.relation + "SchemaImport",
              {
                modules: [options.relation],
                location: `./${options.relation}`,
              }
            );

          // Push Column
          Parsed.push(
            "ColumnsContainer",
            options.relation
              ? options.arrayof === "Relation"
                ? "ManyRelationTemplate"
                : "OneRelationTemplate"
              : "ColumnTemplate",
            options.name + "Column",
            {
              name: options.name,
              datatype:
                options.type === "Array"
                  ? `Array<${
                      options.arrayof === "Record"
                        ? `Record<string, ${options.recordType || "any"}>`
                        : options.arrayof?.toLowerCase()
                    }>`
                  : options.type === "Enum"
                  ? `"${options.choices?.join('" | "')}"`
                  : options.type === "Record"
                  ? `Record<string, ${options.recordType || "any"}>`
                  : options.type.toLowerCase(),
              options: `{${
                options.length !== undefined && options.length !== 50
                  ? `\nlength: ${options.length || null},`
                  : ""
              }${options.public === false ? `\npublic: false,` : ""}${
                options.collation !== undefined &&
                options.collation !== "utf8mb4_unicode_ci"
                  ? `\ncollation: "${options.collation}",`
                  : ""
              }${
                options.choices
                  ? `\nchoices: ["${options.choices.join('", "')}"],`
                  : ""
              }${options.nullable ? `\nnullable: true,` : ""}${
                options.index?.length
                  ? `\nindex: ["${options.index.join('", "')}"],`
                  : ""
              }${
                options.defaultValue
                  ? `\ndefaultValue: ${options.defaultValue},`
                  : ""
              }${
                options.onUpdate ? `\nonUpdate: ${options.onUpdate},` : ""
              }\n}`,
              schema: options.schema,
              relation: options.relation,
              mapping: JSON.stringify(options.mapping),
            }
          ).render();
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            _.lastAccess!.schema = options.schema;

            // Remove Duplicate Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-schema-column" &&
                  transaction.params.schema === options.schema &&
                  transaction.params.name === options.name
                )
            );

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
  }

  static deleteSchemaColumn = async (options: DeleteSchemaColumnOptions) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Deleting the Column",
        task: async () => {
          // Parse Template
          const Parsed = new TemplateParser({
            inDir: Project.SchemasPath(),
            inFile: `./${options.schema}.ts`,
            outFile: `./${options.schema}.ts`,
          })
            .parse()
            .pop("ColumnsContainer", options.name + "Column");

          // Find & Undo (create-schema) Transaction related to this Schema
          const Transaction = ConfigManager.getConfig(
            "transactions"
          ).transactions.reduce<TransactionInterface | null>(
            (result, transaction) =>
              result
                ? result
                : transaction.command === "create-schema-column" &&
                  transaction.params.schema === options.schema &&
                  transaction.params.name === options.name
                ? transaction
                : null,
            null
          );

          // Pop Relation Import
          if (Transaction && typeof Transaction.params.relation === "string")
            Parsed.pop(
              "ImportsContainer",
              Transaction.params.relation + "SchemaImport"
            );

          Parsed.render();
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            _.lastAccess!.schema = options.name;

            // Remove Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-schema-column" &&
                  transaction.params.schema === options.schema &&
                  transaction.params.name === options.name
                )
            );

            return _;
          });
        },
      },
    ]).run();
  };

  static createMiddleware = async (
    options: CreateMiddlewareOptions,
    command: CommandInterface
  ) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating new Middleware",
        task: () => {
          // Parse Template
          new TemplateParser({
            inDir:
              options.templateDir ||
              Path.join(Project.SamplesPath(), "./middleware/"),
            inFile: `./${options.template}.ts`,
            outDir: Project.MiddlewaresPath(),
            outFile: `./${options.name}.ts`,
          })
            .parse()
            .render((_) => _.replace(/Sample/g, options.name));
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parse Template
            new TemplateParser({
              inDir: Project.AppPath(),
              inFile: `./core/middlewares.ts`,
              outFile: `./core/middlewares.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "MiddlewareImport",
                {
                  modules: [options.name + "Middleware"],
                  location: `./${Path.relative(
                    Project.AppCore(),
                    Path.join(Project.MiddlewaresPath(), options.name)
                  ).replace(/\\/g, "/")}`,
                }
              )
              .push(
                "MiddlewaresContainer",
                "MiddlewareTemplate",
                options.name + "Middleware",
                {
                  middleware: options.name + "Middleware",
                }
              )
              .render();
          } catch (error) {
            console.warn(
              "We are unable to parse core/middlewares properly! Please add the child controller manually.",
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            _.lastAccess!.middleware = options.name;

            // Remove Duplicate Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-middleware" &&
                  transaction.params.name === options.name
                )
            );

            // Add New Transaction
            _.transactions.push({
              command: command.name,
              params: options,
            });

            return _;
          }).setConfig("resources", (_) => {
            // Remove Duplicate Resource
            _.resources = _.resources.filter(
              (resource) =>
                !(
                  resource.type === "middleware" &&
                  resource.name === options.name
                )
            );

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
  };

  static async deleteMiddleware(options: DeleteMiddlewareOptions) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Deleting the Middlware",
        task: async () => {
          // Delete Middleware
          Fs.unlinkSync(
            Path.join(Project.MiddlewaresPath(), `./${options.name}.ts`)
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parse Template
            new TemplateParser({
              inDir: Project.AppPath(),
              inFile: `./core/middlewares.ts`,
              outFile: `./core/middlewares.ts`,
            })
              .parse()
              .pop("ImportsContainer", options.name + "MiddlewareImport")
              .pop("MiddlewaresContainer", options.name + "Middleware")
              .render();
          } catch (error) {
            console.warn(
              `We are unable to parse core/middlewares properly! Please remove the schema from core/middlewares manually.`,
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            delete _.lastAccess!.middleware;

            // Remove Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-middleware" &&
                  transaction.params.name === options.name
                )
            );

            return _;
          }).setConfig("resources", (_) => {
            _.resources = _.resources.filter(
              (resource) =>
                !(
                  resource.type === "middleware" &&
                  resource.name === options.name
                )
            );

            return _;
          });
        },
      },
    ]).run();
  }

  static async addPlugin(options: AddPluginOptions, command: CommandInterface) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Installing Plugin...",
        task: () => {
          // Get Configuration
          const Configuration = ConfigManager.getConfig("main");

          // Install Plugin
          if (Configuration.packageManager === "npm")
            return Execa("npm", ["install", options.name]);
          else if (Configuration.packageManager === "yarn")
            Execa("yarn", ["add", options.name]);
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Remove Duplicate Transactions
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === command.name &&
                  transaction.params.name === options.name
                )
            );

            // Add Transaction
            _.transactions.push({
              command: command.name,
              params: options,
            });

            return _;
          });
        },
      },
    ]).run();

    // Link Plugin
    if (command.source === "Cli") await Project.linkPlugin(options);
  }

  static async linkPlugin(options: AddPluginOptions) {
    // Resolve Plugin Name
    options.name = options.name.split(/(?!^@)@/g)[0];

    await new Listr<{ package: any; resources?: ResourcesInterface }>([
      {
        title: "Making sure we are ready to link plugin to the project...",
        task: (ctx) => {
          // Check If Valid Plugin
          if (
            !Fs.existsSync(
              Path.join(
                ConfigManager.Options.rootPath,
                `./node_modules/${options.name}/epic.config.json`
              )
            )
          )
            throw new Error(
              `We didn't found Configuration file on the plugin directory!`
            );

          // Validate Plugin
          const Configuration: ConfigurationInterface = require(Path.join(
            ConfigManager.Options.rootPath,
            `./node_modules/${options.name}/epic.config.json`
          ));

          if (Configuration.type !== "Plugin")
            throw new Error(
              `Subject is not a plugin! Cannot link to the project.`
            );

          // Check If Resources Exist
          if (
            !Object.keys(ConfigManager.getConfig("main").plugins).includes(
              options.name
            ) &&
            Fs.existsSync(
              Path.join(
                ConfigManager.Options.rootPath,
                `./node_modules/${options.name}/epic.resources.json`
              )
            )
          ) {
            // Get Package
            ctx.package = require(Path.join(
              ConfigManager.Options.rootPath,
              `./node_modules/${options.name}/package.json`
            ));

            // Get Plugin Resources
            ctx.resources = require(Path.join(
              ConfigManager.Options.rootPath,
              `./node_modules/${options.name}/epic.resources.json`
            ));

            // Get Current Resources
            const Resources = ConfigManager.getConfig("resources").resources;

            // Check Resource Version
            if (ctx.resources && ctx.resources!.version === 1) {
              // Filter Conflicting Resources
              const Conflictions: Array<ResourceInterface> = ctx.resources.resources.filter(
                (resource) =>
                  Resources.reduce<boolean>(
                    (conflicts, pluginResource) =>
                      !conflicts
                        ? resource.type === pluginResource.type &&
                          resource.name === pluginResource.name
                        : conflicts,
                    false
                  )
              );

              if (Conflictions.length) {
                console.log("Conflicting Resources:", Conflictions);
                throw new Error(
                  `We have found some conflictions with the plugin!`
                );
              }
            } else
              throw new Error(
                `We cannot link this plugin! Resource version is not supported.`
              );
          }
        },
      },
      {
        title: "Linking the plugin...",
        task: (ctx) => {
          if (typeof ctx.resources === "object") {
            // Add All Resources
            ctx.resources.resources.forEach((resource) => {
              // Link Plugin File
              const TargetFile =
                resource.type === "controller"
                  ? `./core/controllers.ts`
                  : resource.type === "schema"
                  ? `./core/database.ts`
                  : `./core/middlewares.ts`;

              // Parse Template
              new TemplateParser({
                inDir: Project.AppPath(),
                inFile: TargetFile,
                outFile: TargetFile,
              })
                .parse()
                .push(
                  "ImportsContainer",
                  "ImportsTemplate",
                  `${options.name}-${resource.type}-${resource.name}-import`,
                  {
                    modules: [
                      resource.type === "schema"
                        ? resource.name
                        : resource.name +
                          (resource.type === "controller"
                            ? "Controller"
                            : "Middleware"),
                    ],
                    location:
                      options.name +
                      `/build/${resource.type}s/${resource.name}`,
                  }
                )
                .push(
                  resource.type === "controller"
                    ? "ControllerChildsContainer"
                    : resource.type === "schema"
                    ? "SchemaListContainer"
                    : "MiddlewaresContainer",
                  resource.type === "controller"
                    ? "ControllerChildTemplate"
                    : resource.type === "schema"
                    ? "SchemaListTemplate"
                    : "MiddlewareTemplate",
                  `${options.name}-${resource.type}-${resource.name}-resource`,
                  {
                    [resource.type === "controller"
                      ? "child"
                      : resource.type === "schema"
                      ? "schema"
                      : "middleware"]:
                      resource.type === "schema"
                        ? resource.name
                        : resource.name +
                          (resource.type === "controller"
                            ? "Controller"
                            : "Middleware"),
                  }
                )
                .render();

              // Push Resource to Record
              ConfigManager.setConfig("resources", (_) => {
                // Remove Duplicate Resource
                _.resources = _.resources.filter(
                  (oldResource) =>
                    !(
                      oldResource.type === resource.type &&
                      oldResource.name === resource.name
                    )
                );

                // Remove Duplicate
                _.resources.push(resource);

                return _;
              });
            });

            // Add Exports Resolver File
            Fs.writeFileSync(
              Path.join(
                ConfigManager.Options.rootPath,
                `./node_modules/${options.name}/exports.js`
              ),
              `
              "use strict";
              var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
                  if (k2 === undefined) k2 = k;
                  Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
              }) : (function(o, m, k, k2) {
                  if (k2 === undefined) k2 = k;
                  o[k2] = m[k];
              }));
              var __exportStar = (this && this.__exportStar) || function(m, exports) {
                  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
              };
              Object.defineProperty(exports, "__esModule", { value: true });
              __exportStar(require("../../../../src/core/controllers"), exports);
              __exportStar(require("../../../../src/core/database"), exports);
              __exportStar(require("../../../../src/core/globals"), exports);
              __exportStar(require("../../../../src/core/middlewares"), exports);
              __exportStar(require("../../../../src/core/server"), exports);
              __exportStar(require("../../../../src/core/typings"), exports);
              `
            );
          }
        },
      },
      {
        title: "Configuring your project",
        task: (ctx) => {
          if (typeof ctx.resources === "object")
            // Update Configuration & Transactions
            ConfigManager.setConfig("main", (_) => {
              _.plugins[ctx.package.name] = `^${ctx.package.version}`;

              return _;
            }).setConfig("transactions", (_) => {
              // Remove Duplicate Transactions
              _.transactions = _.transactions.filter(
                (transaction) =>
                  !(
                    transaction.command === "link-plugin" &&
                    transaction.params.name === options.name
                  )
              );

              // Add Transaction
              _.transactions.push({
                command: "link-plugin",
                params: options,
              });

              return _;
            });
        },
      },
    ]).run();
  }

  static async updatePlugin(
    options: AddPluginOptions,
    command: CommandInterface
  ) {
    // Remove Plugin
    await Project.removePlugin(options, command);

    // Add Plugin
    await Project.addPlugin(options, command);
  }

  static async removePlugin(
    options: RemovePluginOptions,
    command: CommandInterface
  ) {
    // Unlink Plugin
    if (command.source === "Cli") await Project.unlinkPlugin(options);

    // Queue the Tasks
    await new Listr([
      {
        title: "Uninstalling the Plugin...",
        task: () => {
          // Get Configuration
          const Configuration = ConfigManager.getConfig("main");

          // Install Plugin
          if (Configuration.packageManager === "npm")
            return Execa("npm", ["uninstall", options.name]);
          else if (Configuration.packageManager === "yarn")
            Execa("yarn", ["remove", options.name]);
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Remove Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "add-plugin" &&
                  transaction.params.name === options.name
                )
            );

            return _;
          });
        },
      },
    ]).run();
  }

  static async unlinkPlugin(options: RemovePluginOptions) {
    await new Listr<{ resources?: ResourcesInterface }>([
      {
        title: "Loading resource configuration...",
        task: (ctx) => {
          // Check If Resources Exist
          if (
            Fs.existsSync(
              Path.join(
                ConfigManager.Options.rootPath,
                `./node_modules/${options.name}/epic.resources.json`
              )
            )
          )
            // Get Plugin Resources
            ctx.resources = require(Path.join(
              ConfigManager.Options.rootPath,
              `./node_modules/${options.name}/epic.resources.json`
            ));
          {
          }
        },
      },
      {
        title: "Unlinking the plugin...",
        task: (ctx) => {
          if (typeof ctx.resources === "object")
            // Add All Resources
            ctx.resources.resources.forEach((resource) => {
              const TargetFile =
                resource.type === "controller"
                  ? `./core/controllers.ts`
                  : resource.type === "schema"
                  ? `./core/database.ts`
                  : `./core/middlewares.ts`;

              // Parse Template
              new TemplateParser({
                inDir: Project.AppPath(),
                inFile: TargetFile,
                outFile: TargetFile,
              })
                .parse()
                .pop(
                  "ImportsContainer",
                  `${options.name}-${resource.type}-${resource.name}-import`
                )
                .pop(
                  resource.type === "controller"
                    ? "ControllerChildsContainer"
                    : resource.type === "schema"
                    ? "SchemaListContainer"
                    : "MiddlewaresContainer",
                  `${options.name}-${resource.type}-${resource.name}-resource`
                )
                .render();
            });
        },
      },
      {
        title: "Configuring your project",
        task: (ctx) => {
          if (typeof ctx.resources === "object")
            // Update Configuration & Transactions
            ConfigManager.setConfig("main", (_) => {
              delete _.plugins[options.name];

              return _;
            })
              .setConfig("transactions", (_) => {
                // Remove Transaction
                _.transactions = _.transactions.filter(
                  (transaction) =>
                    !(
                      transaction.command === "link-plugin" &&
                      transaction.params.name === options.name
                    )
                );

                return _;
              })
              .setConfig("resources", (_) => {
                ctx.resources!.resources.forEach((resource) => {
                  // Remove Resource
                  _.resources = _.resources.filter(
                    (oldResource) =>
                      !(
                        oldResource.type === resource.type &&
                        oldResource.name === resource.name
                      )
                  );
                });

                return _;
              });
        },
      },
    ]).run();
  }
}
