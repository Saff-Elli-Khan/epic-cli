import Path from "path";
import Fs from "fs";
import Execa from "execa";
import Listr from "listr";
import {
  ProjectType,
  ConfigManager,
  ConfigurationInterface,
  TransactionInterface,
} from "./core";
import { generateRandomKey } from "./utils";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { TemplateParser } from "@saffellikhan/epic-parser";

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

    if (Configuration?.type === "Plugin") {
      // Remove Git Information
      Package.homepage = undefined;
      Package.repository = undefined;
      Package.bugs = undefined;

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
          Execa("yarn").catch(() => {
            ctx.yarn = false;

            task.skip(
              "Yarn not available, install it via `npm install -g yarn`"
            );
          }),
      },
      {
        title: "Installing package dependencies with npm",
        enabled: (ctx) => ctx.yarn === false,
        task: () => Execa("npm", ["install"]),
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
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!ConfigManager.hasConfig("main"))
            throw new Error("Please initialize a project first!");
        },
      },
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
              options.name + "Import",
              {
                modules: [options.name],
                location: Path.relative(
                  Project.ControllersPath(),
                  Path.join(Project.SchemasPath(), options.name)
                ).replace(/\\/g, "/"),
              }
            );

          // Render Controller Content
          Parsed.render(
            (_) =>
              _.replace(
                /@AppPath/g,
                Path.relative(
                  Project.ControllersPath(),
                  Project.AppPath()
                ).replace(/\\/g, "/")
              ) // Add App Path
                .replace(/Sample/g, options.name) // Add Name
          );
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
                options.parent === "None" ? "App.controllers" : options.parent
              }.ts`,
              outFile: `./${
                options.parent === "None" ? "App.controllers" : options.parent
              }.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "Import",
                {
                  modules: [options.name + "Controller"],
                  location: `./${Path.relative(
                    options.parent === "None"
                      ? Project.AppPath()
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
              "We are unable to parse App.controllers properly! Please add the child controller manually.",
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("main", (_) => {
            _.lastAccess!.controller = options.name;

            return _;
          })
            .setConfig("transactions", (_) => {
              // Add New Transaction
              _.transactions.push({
                command: command.name,
                params: options,
              });

              return _;
            })
            .setConfig("resources", (_) => {
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
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!ConfigManager.hasConfig("main"))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Deleting the controller",
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
                    ? "App.controllers"
                    : Transaction.params.parent
                }.ts`,
                outFile: `./${
                  Transaction.params.parent === "None"
                    ? "App.controllers"
                    : Transaction.params.parent
                }.ts`,
              })
                .parse()
                .pop("ImportsContainer", options.name + "Import")
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
          ConfigManager.setConfig("main", (_) => {
            _.lastAccess!.controller = options.name;

            return _;
          })
            .setConfig("transactions", (_) => {
              _.transactions = _.transactions.filter(
                (transaction) =>
                  !(
                    transaction.command === "create-controller" &&
                    transaction.params.name === options.name
                  )
              );

              return _;
            })
            .setConfig("resources", (_) => {
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
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!ConfigManager.hasConfig("main"))
            throw new Error("Please initialize a project first!");
        },
      },
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
            .render(
              (_) =>
                _.replace(
                  /@AppPath/g,
                  Path.relative(
                    Project.SchemasPath(),
                    Project.AppPath()
                  ).replace(/\\/g, "/")
                ) // Add App Path
                  .replace(/Sample/g, options.name) // Add Name
            );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parse Template App.database.ts
            new TemplateParser({
              inDir: Project.AppPath(),
              inFile: `./App.database.ts`,
              outFile: `./App.database.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "Import",
                {
                  modules: [options.name],
                  location: `./${Path.relative(
                    Project.AppPath(),
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
              "We are unable to parse App.database properly! Please add the schema to the list manually.",
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("main", (_) => {
            _.lastAccess!.schema = options.name;

            return _;
          })
            .setConfig("transactions", (_) => {
              // Add New Transaction
              _.transactions.push({
                command: command.name,
                params: options,
              });

              return _;
            })
            .setConfig("resources", (_) => {
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
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!ConfigManager.hasConfig("main"))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Deleting the schema",
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
          // Find & Undo (create-schema) Transaction related to this Schema
          const Transaction = ConfigManager.getConfig(
            "transactions"
          ).transactions.reduce<TransactionInterface | null>(
            (result, transaction) =>
              result
                ? result
                : transaction.command === "create-schema" &&
                  transaction.params.name === options.name
                ? transaction
                : null,
            null
          );

          // If Transaction Exists
          if (Transaction) {
            try {
              // Parse Template
              new TemplateParser({
                inDir: Project.AppPath(),
                inFile: `./App.database.ts`,
                outFile: `./App.database.ts`,
              })
                .parse()
                .pop("ImportsContainer", options.name + "Import")
                .pop("SchemaListContainer", options.name + "Schema")
                .render();
            } catch (error) {
              console.warn(
                `We are unable to parse App.database properly! Please remove the schema from App.database manually.`,
                error
              );
            }
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("main", (_) => {
            _.lastAccess!.schema = options.name;

            return _;
          })
            .setConfig("transactions", (_) => {
              _.transactions = _.transactions.filter(
                (transaction) =>
                  !(
                    transaction.command === "create-schema" &&
                    transaction.params.name === options.name
                  )
              );

              return _;
            })
            .setConfig("resources", (_) => {
              _.resources = _.resources.filter(
                (resource) =>
                  !(
                    resource.type === "schema" && resource.name === options.name
                  )
              );

              return _;
            });
        },
      },
    ]).run();
  }
}
