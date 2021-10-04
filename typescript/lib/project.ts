import Path from "path";
import Fs from "fs";
import Execa from "execa";
import Listr from "listr";
import { ProjectType, ConfigManager, ConfigurationInterface } from "./core";
import { generateRandomKey } from "./utils";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { TemplateParser } from "@saffellikhan/epic-parser";
import { EpicCli } from "../cli";

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

export class Project {
  static PackagePath = () =>
    Path.join(ConfigManager.Options.rootPath, "./package.json");

  static EnvironmentsPath = () =>
    Path.join(ConfigManager.Options.rootPath, "./env/");

  static AppPath = () => Path.join(ConfigManager.Options.rootPath, "./src/");

  static SamplesPath = () =>
    Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.templates!
    );

  static ControllersPath = () =>
    Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.contollers!
    );

  static SchemasPath = () =>
    Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.schemas!
    );

  static MiddlewaresPath = () =>
    Path.join(
      ConfigManager.Options.rootPath,
      ConfigManager.getConfig("main").paths!.middlewares!
    );

  static getPackage() {
    return require(this.PackagePath());
  }

  static configure(Configuration: ConfigurationInterface) {
    // Get Package Information
    const Package = this.getPackage();

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
    Fs.writeFileSync(this.PackagePath(), JSON.stringify(Package, undefined, 2));

    // Re-Create Configuration
    ConfigManager.setConfig("main", Configuration);

    // Create Environment Directory
    Fs.mkdirSync(this.EnvironmentsPath(), {
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
          if (Fs.existsSync(this.PackagePath()))
            // Configure Project
            this.configure(ConfigManager.getConfig("main"));
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
            this.configure(configuration);

            // Throw Git Error
            throw error;
          }
        },
      },
      {
        title: "Configuring your project",
        task: ({ configuration }) => {
          if (Fs.existsSync(this.PackagePath())) {
            // Configure Project
            this.configure(configuration);

            // Create Environment Files
            ["development", "production"].forEach((env) =>
              Fs.writeFileSync(
                Path.join(this.EnvironmentsPath(), `./.${env}.env`),
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
    await new Listr<{ controllerContent: string }>([
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
          new TemplateParser({
            inDir:
              options.templateDir ||
              Path.join(this.SamplesPath(), "./controllers/"),
            inFile: `./${options.template}.ts`,
            outDir: this.ControllersPath(),
            outFile: `./${options.name}.ts`,
          })
            .parse()
            .injections({
              ControllerPrefix: options.prefix,
            })
            .push(
              "ImportsContainer",
              "ImportsTemplate",
              options.name + "Import",
              {
                modules: [options.name],
                location: Path.relative(
                  this.ControllersPath(),
                  Path.join(this.SchemasPath(), options.name)
                ).replace(/\\/g, "/"),
              }
            )
            .render(
              (_) =>
                _.replace(
                  /@AppPath/g,
                  Path.relative(this.ControllersPath(), this.AppPath()).replace(
                    /\\/g,
                    "/"
                  )
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
              inDir: this.ControllersPath(),
              inFile: `./${options.parent}.ts`,
              outFile: `./${options.parent}.ts`,
            })
              .parse()
              .push(
                "ImportsContainer",
                "ImportsTemplate",
                options.name + "Import",
                {
                  modules: [options.name + "Controller"],
                  location: `./${options.name}`,
                }
              )
              .push(
                "ControllerChildsContainer",
                "ControllerChildsListTemplate",
                options.name + "ControllerChilds",
                {
                  child: options.name + "Controller",
                }
              )
              .render();
          } catch (e) {
            EpicCli.Logger.warn(
              "We are unable to parse controllers/index properly! Please add the child controller manually."
            ).log();
          }

          // Update Configuration & Transactions
          ConfigManager.setConfig("main", (_) => {
            // Update Last Access
            _.lastAccess!.controller = options.name;

            return _;
          }).setConfig("transactions", (_) => {
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
          });
        },
      },
    ]).run();
  }
}
