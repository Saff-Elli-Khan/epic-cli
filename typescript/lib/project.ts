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
  ResourceInterface,
  DatabaseEngine,
} from "./core";
import {
  generateRandomKey,
  copyFolderRecursiveSync,
  removeFolderRecursiveSync,
} from "./utils";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { TemplateParser } from "@saffellikhan/epic-parser";

export interface InitializationOptions {
  type: ProjectType;
  dbEngine: DatabaseEngine;
  name: string;
  description: string;
  brandName: string;
  brandCountry: string;
  brandAddress: string;
}

export interface CreateOptions {
  admin: boolean;
  installation: boolean;
  yarn: boolean;
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

export interface CreateModelOptions {
  name: string;
  description: string;
  template: string;
  templateDir?: string;
}

export interface DeleteModelOptions {
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

export interface CreateJobOptions {
  name: string;
  description: string;
  template: string;
  templateDir?: string;
}

export interface DeleteJobOptions {
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

  static ModelsPath() {
    return Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.models!
    );
  }

  static MiddlewaresPath() {
    return Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.middlewares!
    );
  }

  static JobsPath() {
    return Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.jobs!
    );
  }

  static getPackage(silent = false) {
    if (!Fs.existsSync(Project.PackagePath()))
      if (!silent) throw new Error(`package.json has not been found!`);
      else return null;

    return require(Project.PackagePath());
  }

  static getAdminDashboardPathName() {
    return "admin";
  }

  static configure(Configuration: ConfigurationInterface) {
    // Get Package Information
    const Package = Project.getPackage(true);

    if (Package !== null) {
      // Update Package Information
      Package.name = Configuration?.name || Package.name;
      Package.description = Configuration?.description || Package.description;
      Package.private = Configuration?.type === "application";

      if (Configuration?.type === "plugin") {
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
    }

    // Re-Create Configuration
    ConfigManager.setConfig("main", Configuration);
  }

  static async initialize(options: InitializationOptions) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating/Updating configuration...",
        task: () => {
          // Set New Configuration
          ConfigManager.setConfig("main", (config) => ({
            type: options.type,
            name: options.name,
            description: options.description,
            brand: {
              name: options.brandName,
              country: options.brandCountry,
              address: options.brandAddress,
            },
            database: {
              engine: options.dbEngine,
              type: (options.dbEngine === "mongodb" ? "simple" : "pool") as any,
              uri:
                options.dbEngine === "mongodb"
                  ? "mongodb://localhost:27017/test"
                  : "mysql://root@localhost:3306/test",
            },
            supportedDBEngines: (options.dbEngine === "mongodb"
              ? ["mongodb"]
              : ["mysql"]) as any,
            other: {
              ...config.other,
              [options.name]: {},
            },
          }));
        },
      },
      {
        title: "Configuring your project",
        task: () => Project.configure(ConfigManager.getConfig("main")),
      },
    ]).run();
  }

  static async create(options: CreateOptions) {
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
            // Remove .git folder
            await Execa("npx", ["rimraf", "./.git"]);

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
        title: `Cloning dashboard to the ${Project.getAdminDashboardPathName()} directory`,
        task: () =>
          Execa("git", [
            "clone",
            "https://github.com/Saff-Elli-Khan/epic-dashboard",
            `./${Project.getAdminDashboardPathName()}/`,
          ]),
        skip: () => !options.admin,
      },
      {
        title: "Configuring your project",
        task: ({ configuration }) => {
          // Configure Project
          Project.configure(configuration);

          // Create Environment Directory
          Fs.mkdirSync(Project.EnvironmentsPath(), {
            recursive: true,
          });

          // Create Environment Files
          ["development", "production"].forEach((env) =>
            Fs.writeFileSync(
              Path.join(Project.EnvironmentsPath(), `./.${env}.env`),
              `ENCRYPTION_KEY=${generateRandomKey(32)}`
            )
          );
        },
      },
      {
        title: "Installing application dependencies with Yarn",
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
        skip: () => !options.installation || !options.yarn,
      },
      {
        title: "Installing application dependencies with npm",
        task: () =>
          Execa("npm", ["install"]).then(() => {
            ConfigManager.setConfig("main", (_) => {
              // Set Package Manager
              _.packageManager = "npm";

              return _;
            });
          }),
        enabled: (ctx) => ctx.yarn === false || !options.yarn,
        skip: () => !options.installation,
      },
      {
        title: "Installing admin dashboard dependencies with Yarn",
        task: (ctx, task) =>
          Execa("yarn", undefined, {
            cwd: Path.join(
              ConfigManager.Options.rootPath,
              `./${Project.getAdminDashboardPathName()}/`
            ),
          }).catch(() => {
            ctx.yarn = false;

            task.skip(
              "Yarn not available, you can install it via `npm install -g yarn` if needed."
            );
          }),
        skip: () => !options.installation || !options.admin || !options.yarn,
      },
      {
        title: "Installing admin dashboard dependencies with npm",
        task: () =>
          Execa("npm", ["install"], {
            cwd: Path.join(
              ConfigManager.Options.rootPath,
              `./${Project.getAdminDashboardPathName()}/`
            ),
          }),
        enabled: (ctx) => ctx.yarn === false || !options.yarn,
        skip: () => !options.installation || !options.admin,
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
          if (
            !Fs.existsSync(
              Path.join(Project.ControllersPath(), `./${options.name}.ts`)
            )
          ) {
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
                AppName: ConfigManager.getConfig("main").name,
              });

            // Push Database Model
            if (options.template === "default")
              Parsed.push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "ModelImport",
                {
                  modules: [options.name],
                  location: Path.relative(
                    Project.ControllersPath(),
                    Path.join(Project.ModelsPath(), options.name)
                  ).replace(/\\/g, "/"),
                }
              );

            // Render Controller Content
            Parsed.render((_) => _.replace(/Sample/g, options.name));
          }
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
              "We are unable to parse core/controllers properly! Please add the controller manually.",
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
              source: ConfigManager.getConfig("main").name,
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

  static async createModel(
    options: CreateModelOptions,
    command: CommandInterface
  ) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating new Model",
        task: () => {
          if (
            !Fs.existsSync(
              Path.join(Project.ModelsPath(), `./${options.name}.ts`)
            )
          )
            // Parse Template
            new TemplateParser({
              inDir:
                options.templateDir ||
                Path.join(Project.SamplesPath(), "./model/"),
              inFile: `./${options.template}.ts`,
              outDir: Project.ModelsPath(),
              outFile: `./${options.name}.ts`,
            })
              .parse()
              .injections({
                AppName: ConfigManager.getConfig("main").name,
              })
              .render((_) => _.replace(/Sample/g, options.name));
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parse Template core/models.ts
            new TemplateParser({
              inDir: Project.AppPath(),
              inFile: `./core/models.ts`,
              outFile: `./core/models.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "ModelImport",
                {
                  modules: [options.name],
                  location: `./${Path.relative(
                    Project.AppCore(),
                    Path.join(Project.ModelsPath(), options.name)
                  ).replace(/\\/g, "/")}`,
                }
              )
              .push(
                "ModelListContainer",
                "ModelListTemplate",
                options.name + "Model",
                {
                  model: options.name,
                }
              )
              .render();
          } catch (error) {
            console.warn(
              "We are unable to parse core/models properly! Please add the model to the list manually.",
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            _.lastAccess!.model = options.name;

            // Remove Duplicate Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-model" &&
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
                !(resource.type === "model" && resource.name === options.name)
            );

            // Add New Resource
            _.resources.push({
              source: ConfigManager.getConfig("main").name,
              type: "model",
              name: options.name,
            });

            return _;
          });
        },
      },
    ]).run();
  }

  static async deleteModel(options: DeleteModelOptions) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Deleting the Model",
        task: async () => {
          // Delete Model
          Fs.unlinkSync(
            Path.join(Project.ModelsPath(), `./${options.name}.ts`)
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
              inFile: `./core/models.ts`,
              outFile: `./core/models.ts`,
            })
              .parse()
              .pop("ImportsContainer", options.name + "ModelImport")
              .pop("ModelListContainer", options.name + "Model")
              .render();
          } catch (error) {
            console.warn(
              `We are unable to parse core/models properly! Please remove the model from core/models manually.`,
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            delete _.lastAccess!.model;

            // Remove Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-model" &&
                  transaction.params.name === options.name
                )
            );

            return _;
          }).setConfig("resources", (_) => {
            _.resources = _.resources.filter(
              (resource) =>
                !(resource.type === "model" && resource.name === options.name)
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
    command.name = "create-model";

    // Create New Model
    await Project.createModel(options, command);
  }

  static async deleteModule(options: DeleteControllerOptions) {
    await Project.deleteController(options);
    await Project.deleteModel(options);
  }

  static createMiddleware = async (
    options: CreateMiddlewareOptions,
    command: CommandInterface
  ) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating new Middleware",
        task: () => {
          if (
            !Fs.existsSync(
              Path.join(Project.MiddlewaresPath(), `./${options.name}.ts`)
            )
          )
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
              .injections({
                AppName: ConfigManager.getConfig("main").name,
              })
              .render();
          } catch (error) {
            console.warn(
              "We are unable to parse core/middlewares properly! Please add the middleware manually.",
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
              source: ConfigManager.getConfig("main").name,
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
              `We are unable to parse core/middlewares properly! Please remove the middleware from core/middlewares manually.`,
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

  static async createJob(options: CreateJobOptions, command: CommandInterface) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating new Cron Job...",
        task: () => {
          if (
            !Fs.existsSync(
              Path.join(Project.JobsPath(), `./${options.name}.ts`)
            )
          )
            // Parse Template
            new TemplateParser({
              inDir:
                options.templateDir ||
                Path.join(Project.SamplesPath(), "./job/"),
              inFile: `./${options.template}.ts`,
              outDir: Project.JobsPath(),
              outFile: `./${options.name}.ts`,
            })
              .parse()
              .injections({
                AppName: ConfigManager.getConfig("main").name,
              })
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
              inFile: `./core/jobs.ts`,
              outFile: `./core/jobs.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "JobImport",
                {
                  modules: [options.name + "Job"],
                  location: `./${Path.relative(
                    Project.AppCore(),
                    Path.join(Project.JobsPath(), options.name)
                  ).replace(/\\/g, "/")}`,
                }
              )
              .push("JobsContainer", "JobTemplate", options.name + "Job", {
                job: options.name + "Job",
              })
              .render();
          } catch (error) {
            console.warn(
              "We are unable to parse core/jobs properly! Please add the job manually.",
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            _.lastAccess!.job = options.name;

            // Remove Duplicate Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-job" &&
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
                !(resource.type === "job" && resource.name === options.name)
            );

            // Add New Resource
            _.resources.push({
              source: ConfigManager.getConfig("main").name,
              type: "job",
              name: options.name,
            });

            return _;
          });
        },
      },
    ]).run();
  }

  static async deleteJob(options: DeleteJobOptions) {
    // Queue the Tasks
    await new Listr([
      {
        title: "Deleting the Job...",
        task: async () => {
          // Delete Job
          Fs.unlinkSync(Path.join(Project.JobsPath(), `./${options.name}.ts`));
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parse Template
            new TemplateParser({
              inDir: Project.AppPath(),
              inFile: `./core/jobs.ts`,
              outFile: `./core/jobs.ts`,
            })
              .parse()
              .pop("ImportsContainer", options.name + "JobImport")
              .pop("JobsContainer", options.name + "Job")
              .render();
          } catch (error) {
            console.warn(
              `We are unable to parse core/jobs properly! Please remove the job from core/jobs manually.`,
              error
            );
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("transactions", (_) => {
            // Update Last Access
            delete _.lastAccess!.job;

            // Remove Transaction
            _.transactions = _.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-job" &&
                  transaction.params.name === options.name
                )
            );

            return _;
          }).setConfig("resources", (_) => {
            _.resources = _.resources.filter(
              (resource) =>
                !(resource.type === "job" && resource.name === options.name)
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

    await new Listr<{
      configuration: ConfigurationInterface;
      package: any;
      resources?: ResourcesInterface;
    }>([
      {
        title: `Making sure we are ready to link plugin '${options.name}' to the project...`,
        task: (ctx) => {
          // Create Path to Plugin
          const PluginPath = Path.join(
            ConfigManager.Options.rootPath,
            `./node_modules/${options.name}/epic.config.json`
          );

          // Check If Valid Plugin
          if (!Fs.existsSync(PluginPath))
            throw new Error(
              `We didn't found Configuration file on the plugin directory on path '${PluginPath}'!`
            );

          // Validate Plugin
          ctx.configuration = require(Path.join(
            ConfigManager.Options.rootPath,
            `./node_modules/${options.name}/epic.config.json`
          ));

          if (ctx.configuration.type !== "plugin")
            throw new Error(
              `${options.name} is not a plugin! Cannot link to the project.`
            );

          // Verify Database Engine Support
          if (
            !ctx.configuration.supportedDBEngines.includes(
              ConfigManager.getConfig("main").database.engine
            )
          )
            throw new Error(
              `Your project does not support the database engine used in this plugin!`
            );

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
            // Check If Resources Exist
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
              const Conflictions: Array<ResourceInterface> =
                ctx.resources.resources
                  .filter(
                    (resource) => !resource.parent || resource.parent === "None"
                  )
                  .filter((resource) =>
                    Resources.reduce<boolean>(
                      (conflicts, Resource) =>
                        !conflicts
                          ? resource.type === Resource.type &&
                            resource.name === Resource.name
                          : conflicts,
                      false
                    )
                  );

              if (Conflictions.length) {
                console.log("Conflicting Resources:", Conflictions);
                ctx.resources.resources = ctx.resources.resources.filter(
                  (resource) =>
                    !Conflictions.filter(
                      (item) =>
                        resource.type === item.type &&
                        resource.name === item.name
                    ).length
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
        task: async (ctx) => {
          // Import Plugin Settings to the Project
          ConfigManager.setConfig("main", (_) => {
            _.other[options.name] = {
              ...ctx.configuration.other[options.name],
              ..._.other[options.name],
            };
            return _;
          });

          // Create Typings Copy
          copyFolderRecursiveSync(
            Path.join(
              ConfigManager.Options.rootPath,
              `./node_modules/${options.name}/typings/`
            ),
            Path.join(
              ConfigManager.Options.rootPath,
              `./typings/${options.name}/`
            ),
            {
              copySubDir: true,
              fileEditor: (_) =>
                _.replace(/@AppPath/g, options.name + `/build`),
            }
          );

          // Add All Resources If Exists
          if (typeof ctx.resources === "object")
            ctx.resources.resources.forEach((resource) => {
              if (
                resource.type !== "controller" ||
                resource.parent === "None"
              ) {
                // Link Plugin File
                const TargetFile =
                  resource.type === "controller"
                    ? `./core/controllers.ts`
                    : resource.type === "middleware"
                    ? `./core/middlewares.ts`
                    : resource.type === "model"
                    ? `./core/models.ts`
                    : resource.type === "job"
                    ? `./core/jobs.ts`
                    : ``;

                // Get Resource Path
                const ResourcePath =
                  options.name +
                  `/build/${
                    resource.type === "controller"
                      ? `controllers`
                      : resource.type === "middleware"
                      ? `middlewares`
                      : resource.type === "model"
                      ? `models`
                      : resource.type === "job"
                      ? `jobs`
                      : ``
                  }/${resource.name}`;

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
                        resource.name +
                          (resource.type === "controller"
                            ? "Controller"
                            : resource.type === "middleware"
                            ? "Middleware"
                            : resource.type === "job"
                            ? "Job"
                            : ""),
                      ],
                      location: resource.path || ResourcePath,
                    }
                  )
                  .push(
                    resource.type === "controller"
                      ? "ControllerChildsContainer"
                      : resource.type === "middleware"
                      ? "MiddlewaresContainer"
                      : resource.type === "model"
                      ? "ModelListContainer"
                      : resource.type === "job"
                      ? "JobsContainer"
                      : "",
                    resource.type === "controller"
                      ? "ControllerChildTemplate"
                      : resource.type === "middleware"
                      ? "MiddlewareTemplate"
                      : resource.type === "model"
                      ? "ModelListTemplate"
                      : resource.type === "job"
                      ? "JobTemplate"
                      : "",
                    `${options.name}-${resource.type}-${resource.name}-resource`,
                    {
                      [resource.type === "controller"
                        ? "child"
                        : resource.type]:
                        resource.name +
                        (resource.type === "controller"
                          ? "Controller"
                          : resource.type === "middleware"
                          ? "Middleware"
                          : resource.type === "job"
                          ? "Job"
                          : ""),
                    }
                  )
                  .render();

                // Push Resource to Record
                ConfigManager.setConfig("resources", (_) => {
                  // Update Resource Source
                  resource.source = options.name;

                  // Add Resource Path
                  resource.path = resource.path || ResourcePath;

                  // Remove Duplicate Resource
                  _.resources = _.resources.filter(
                    (oldResource) =>
                      !(
                        oldResource.source === resource.source &&
                        oldResource.type === resource.type &&
                        oldResource.name === resource.name
                      )
                  );

                  // Add Resource
                  _.resources.push(resource);

                  return _;
                });
              }
            });
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

  static async linkPlugins() {
    await Promise.all(
      Object.keys(ConfigManager.getConfig("main").plugins).map((name) =>
        Project.linkPlugin({ name })
      )
    );
  }

  static async updatePlugin(options: AddPluginOptions) {
    // Unlink Plugin
    await Project.unlinkPlugin(options);

    // Queue the Tasks
    await new Listr([
      {
        title: "Updating Plugin...",
        task: () => {
          // Get Configuration
          const Configuration = ConfigManager.getConfig("main");

          // Install Plugin
          if (Configuration.packageManager === "npm")
            return Execa("npm", ["uninstall", options.name]).then(() =>
              Execa("npm", ["install", options.name])
            );
          else if (Configuration.packageManager === "yarn")
            Execa("yarn", ["remove", options.name]).then(() =>
              Execa("yarn", ["add", options.name])
            );
        },
      },
    ]).run();

    // Link Plugin
    await Project.linkPlugin(options);
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
    await new Listr<{ resources: ResourceInterface[] }>([
      {
        title: "Checking configuration...",
        task: () => {
          // Check If Plugin Installed
          if (!ConfigManager.getConfig("main").plugins[options.name])
            throw new Error(`Plugin '${options.name}' is not installed!`);
        },
      },
      {
        title: "Unlinking the plugin...",
        task: (ctx) => {
          // Get Current Project Resources
          ctx.resources = ConfigManager.getConfig("resources").resources.filter(
            (resource) => resource.source === options.name
          );

          // Remove Current Plugin Resouces
          if (typeof ctx.resources === "object")
            ctx.resources.forEach((resource) => {
              const TargetFile =
                resource.type === "controller"
                  ? `./core/controllers.ts`
                  : resource.type === "middleware"
                  ? `./core/middlewares.ts`
                  : resource.type === "model"
                  ? `./core/models.ts`
                  : resource.type === "job"
                  ? `./core/jobs.ts`
                  : ``;

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
                    : resource.type === "middleware"
                    ? "MiddlewaresContainer"
                    : resource.type === "model"
                    ? "ModelListContainer"
                    : resource.type === "job"
                    ? "JobsContainer"
                    : "",
                  `${options.name}-${resource.type}-${resource.name}-resource`
                )
                .render();
            });

          // Remove Typings
          removeFolderRecursiveSync(
            Path.join(
              ConfigManager.Options.rootPath,
              `./typings/${options.name}`
            )
          );
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
                ctx.resources.forEach((resource) => {
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

  static async build() {
    await new Listr([
      {
        title: "Making sure we are ready to build the project...",
        task: () => {
          if (!["express"].includes(ConfigManager.getConfig("main").framework))
            throw new Error(`We cannot build this project!`);
        },
      },
      {
        title: "Building the project",
        task: () =>
          Execa(
            "npx -y shx rm -rf tsconfig.tsbuildinfo build && npx -y ttsc -p tsconfig.json && npx shx rm -rf ./build/templates && npx shx cp -R ./src/templates/ ./build/templates/"
          ),
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Exports File Path
          const ExportsPath = Path.join(
            ConfigManager.Options.rootPath,
            `./build/exports.js`
          );

          // Add Exports Resolver File
          Fs.writeFileSync(
            ExportsPath,
            Fs.readFileSync(ExportsPath)
              .toString()
              .replace(
                /__exportStar\(require\("(.*)"\),\s*exports\)/g,
                (_, path: string) =>
                  `__exportStar(require(require("path").join(process.cwd(), "./build", "${path}")), exports)`
              )
          );
        },
      },
    ]).run();
  }
}
