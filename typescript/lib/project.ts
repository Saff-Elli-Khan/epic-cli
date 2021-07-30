import Execa from "execa";
import Listr from "listr";
import Path from "path";
import Fs from "fs";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { generateRandomKey } from "./utils";
import { ConfigurationInterface, Core, TransactionInterface } from "./core";
import { EpicCli } from "../cli";
import { Parser } from "@saffellikhan/epic-parser";

export interface CreateControllerOptions {
  name: string;
  description: string;
  prefix: string;
  template: string;
  parent: string;
  sampleDir?: string;
}

export interface DeleteControllerOptions {
  name: string;
}

export class Project {
  static PackagePath = Path.join(Core.RootPath, "./package.json");
  static EnvironmentsPath = Path.join(Core.RootPath, "./env/");
  static AppPath = Path.join(Core.RootPath, "./src/");
  static SamplesPath = Path.join(
    Core.RootPath,
    Core.getConfiguration()!.paths.samples
  );
  static ControllersPath = Path.join(
    Core.RootPath,
    Core.getConfiguration()!.paths.contollers
  );
  static SchemasPath = Path.join(
    Core.RootPath,
    Core.getConfiguration()!.paths.schemas
  );

  static getPackage = () => require(Project.PackagePath);

  static configure = (Configuration: ConfigurationInterface) => {
    // Update Package Information
    const Package = Project.getPackage();
    Package.name = Configuration?.application?.name || Package.name;
    Package.description =
      Configuration?.application?.description || Package.description;
    Package.brand = {
      name: Configuration?.application?.brand?.name || Package.brand.name,
      country:
        Configuration?.application?.brand?.country || Package.brand.country,
      address:
        Configuration?.application?.brand?.address || Package.brand.address,
    };

    // Put Package Data
    Fs.writeFileSync(
      Project.PackagePath,
      JSON.stringify(Package, undefined, 2)
    );

    // Re-Create Configuration
    Core.setConfiguration(Configuration);

    // Create Environment Directory
    Fs.mkdirSync(Project.EnvironmentsPath, {
      recursive: true,
    });
  };

  static create = async () => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking Configuration...",
        task: async (ctx) => {
          // Check Configuration File
          if (!Core.getConfiguration(true))
            await Execa("epic", ["init", "--yes"]);

          // Get Configuration
          ctx.configuration = Core.getConfiguration();

          // Remove Configuration
          Core.removeConfiguration();
        },
      },
      {
        title: "Cloning repository to current directory",
        task: () =>
          Execa("git", [
            "clone",
            "https://github.com/Saff-Elli-Khan/epic-application",
            ".",
          ]),
      },
      {
        title: "Configuring your project",
        task: ({ configuration }) => {
          if (Fs.existsSync(Project.PackagePath)) {
            // Configure Project
            Project.configure(configuration);

            // Create Environment Files
            ["development", "production"].forEach((env) =>
              Fs.writeFileSync(
                Path.join(Project.EnvironmentsPath, `./.${env}.env`),
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

    return true;
  };

  static createController = async (
    options: CreateControllerOptions,
    command: CommandInterface
  ) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking Configuration...",
        task: async () => {
          // Check Configuration File
          if (!Fs.readdirSync(Core.RootPath).length)
            throw new Error("Please initialize a project first!");
          else if (
            Core.getConfiguration()?.transactions.reduce<boolean>(
              (exists, transaction) =>
                exists
                  ? exists
                  : transaction.command === "create-controller" &&
                    transaction.params.name === options.name,
              false
            )
          )
            throw new Error("Controller already exists!");
        },
      },
      {
        title: "Loading controller sample",
        task: (ctx) => {
          // Load Controller Sample
          ctx.controllerContent = Fs.readFileSync(
            Path.join(
              options.sampleDir || Project.SamplesPath,
              `./controller/${options.template}.ts`
            )
          ).toString();
        },
      },
      {
        title: "Preparing the Controller",
        task: (ctx: { controllerContent: string }) => {
          // Create Relative Path to Schemas
          const SchemaPath = Path.relative(
            Project.ControllersPath,
            Path.join(Project.SchemasPath, options.name)
          ).replace(/\\/g, "/");

          // Create Relative Path To App
          const AppPath = Path.relative(
            Project.ControllersPath,
            Project.AppPath
          ).replace(/\\/g, "/");

          // Parse Template
          const Parsed = new Parser(
            ctx.controllerContent
              .replace(/@AppPath/g, AppPath) // Add App Path
              .replace("{ControllerPrefix}", options.prefix) // Add Controler Prefix
              .replace(/Sample/g, options.name) // Add Name
          ).parse();

          // Push Import
          Parsed.push(
            "ImportsContainer",
            "ImportsTemplate",
            options.name + "Import",
            {
              modules: [options.name],
              location: SchemaPath,
            }
          );

          // Update Controller Sample
          ctx.controllerContent = Parsed.render();
        },
      },
      {
        title: "Creating New Controller",
        task: ({ controllerContent }: { controllerContent: string }) => {
          // Resolve Directory
          Fs.mkdirSync(Project.ControllersPath, { recursive: true });

          // Create Controller
          Fs.writeFileSync(
            Path.join(Project.ControllersPath, `./${options.name}.ts`),
            controllerContent
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parent Controller Path
            const ParentControllerPath = Path.join(
              Project.ControllersPath,
              `./${options.parent}.ts`
            );

            // Get Parent Controller Content & Parse Template
            const Parsed = new Parser(
              Fs.readFileSync(ParentControllerPath).toString()
            ).parse();

            // Push Import
            Parsed.push(
              "ImportsContainer",
              "ImportsTemplate",
              options.name + "Import",
              {
                modules: [options.name + "Controller"],
                location: `./${options.name}`,
              }
            );

            // Push Child Controller
            Parsed.push(
              "ControllerChildsContainer",
              "ControllerChildsListTemplate",
              options.name + "ControllerChilds",
              (content) => {
                // Parse Controllers List
                const ControllersList = ((content || "[]") as string)
                  .replace(/\[([^]*)\]/g, "$1")
                  .replace(/\n*\s+/g, " ")
                  .replace(/^\s*|\s*,\s*$/g, "");

                return {
                  childs: `${ControllersList ? ControllersList + ", " : ""}${
                    options.name + "Controller"
                  }`,
                };
              }
            );

            // Save Parent Controller Content
            Fs.writeFileSync(ParentControllerPath, Parsed.render());
          } catch (e) {
            EpicCli.Logger.warn(
              "We are unable to parse controllers/index properly! Please add the child controller manually."
            ).log();
          }

          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Update Transactions
          Configuration.transactions.push({
            command: command.name,
            params: options,
          });

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };

  static deleteController = async (options: DeleteControllerOptions) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking Configuration...",
        task: async () => {
          // Check Configuration File
          if (!Fs.readdirSync(Core.RootPath).length)
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Deleting the controller",
        task: async () => {
          // Delete Controller
          Fs.unlinkSync(
            Path.join(Project.ControllersPath, `./${options.name}.ts`)
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Find Create Controller Transaction related to this Controller
          const Transaction = Configuration.transactions.reduce<TransactionInterface | null>(
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
          if (Transaction) {
            try {
              // Parent Controller Path
              const ParentControllerPath = Path.join(
                Project.ControllersPath,
                `./${Transaction.params.parent}.ts`
              );

              // Get Parent Controller Content & Parse Template
              const Parsed = new Parser(
                Fs.readFileSync(ParentControllerPath)
                  .toString()
                  .replace(
                    new RegExp(
                      "\\s*(" + options.name + "Controller)\\s*,?\\s*",
                      "g"
                    ),
                    ""
                  )
              ).parse();

              // Remove Child Controller Import
              Parsed.pop("ImportsContainer", options.name + "Import");

              // Save Parent Controller Content
              Fs.writeFileSync(ParentControllerPath, Parsed.render());
            } catch (e) {
              EpicCli.Logger.warn(
                `We are unable to parse controllers/index properly! Please remove the child controller from "${Transaction.params.parent}" manually.`
              ).log();
            }
          }

          // Remove Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-controller" &&
                transaction.params.name === options.name
              )
          );

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };
}
