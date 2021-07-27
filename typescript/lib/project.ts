import Execa from "execa";
import Listr from "listr";
import Path from "path";
import Fs from "fs";
import { generateRandomKey } from "./utils";
import { Core } from "./core";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";

export interface CreateOptions {
  name: string;
  description: string;
  brandName: string;
  brandCountry: string;
  brandAddress: string;
}

export interface CreateControllerOptions {
  name: string;
  description: string;
  version: number;
  prefix: string;
  type: "Core" | "Custom";
  scope: "Parent" | "Child";
  template: string;
}

export class Project {
  static PackagePath = Path.join(process.cwd(), "./package.json");
  static SamplesPath = Path.join(Core.AppPath, "./samples/");

  static getPackage = () => require(Project.PackagePath);

  static create = async (options: CreateOptions) => {
    // Queue the Tasks
    await new Listr([
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
        task: () => {
          if (Fs.existsSync(Project.PackagePath)) {
            // Update Package Information
            Project.getPackage().name = options.name;
            Project.getPackage().description = options.description;
            Project.getPackage().brand = {
              name: options.brandName,
              country: options.brandCountry,
              address: options.brandAddress,
            };

            // Put Package Data
            Fs.writeFileSync(
              Project.PackagePath,
              JSON.stringify(Project.getPackage(), undefined, 2)
            );

            // Create Environment Directory
            Fs.mkdirSync(Path.join(process.cwd(), "./env/"), {
              recursive: true,
            });

            // Create Environment Files
            ["development", "production"].forEach((env) =>
              Fs.writeFileSync(
                Path.join(process.cwd(), `./env/.${env}.env`),
                `ENCRYPTION_KEY=${generateRandomKey(32)}`
              )
            );

            // Create Epic Configuration File
            Core.setConfiguration(Core.DefaultConfig);

            // Create Epic Transactions File
            Core.setTransactions(Core.DefaultTransactions);
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
        title: "Loading controller sample",
        task: (ctx) => {
          // Load Controller Sample
          ctx.controllerContent = Fs.readFileSync(
            Path.join(
              Project.SamplesPath,
              `./controller/${options.template}.ts`
            )
          ).toString();
        },
      },
      {
        title: "Preparing the Controller",
        task: (ctx: { controllerContent: string }) => {
          // Update Controller Sample
          ctx.controllerContent =
            `import { ${options.name} } from "@App/database/${options.type}/${options.name}"\n` + // Add Schema Import
            ctx.controllerContent
              .replace(/\/\/(\s*@Temporary)(?:[^]+?)\/\/(\s*@\/Temporary)/g, "") // Remove Temporary Code
              .replace("{ControllerPrefix}", options.prefix) // Add Controler Prefix
              .replace(/Sample/g, options.name); // Add Name

          // Update Controller Scope
          if (options.scope === "Child")
            ctx.controllerContent.replace("Controller", "ChildController");
        },
      },
      {
        title: "Creating New Controller",
        task: ({ controllerContent }: { controllerContent: string }) => {
          const ControllerDir = Path.join(
            Core.AppPath,
            `./controllers/v${options.version}/${options.type}/`
          );

          // Resolve Directory
          Fs.mkdirSync(ControllerDir, { recursive: true });

          // Create Controller
          Fs.writeFileSync(
            Path.join(ControllerDir, `./${options.name}.ts`),
            controllerContent
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Transactions
          const Transactions = Core.getTransactions();

          // Update Transactions
          Transactions.data.push({
            command: command.name,
            params: options,
          });

          // Set Transactions
          Core.setTransactions(Transactions);
        },
      },
    ]).run();
  };
}
