import Execa from "execa";
import Listr from "listr";
import Path from "path";
import Fs from "fs";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { generateRandomKey } from "./utils";
import { Core } from "./core";
import { EpicCli } from "../cli";

export interface CreateControllerOptions {
  name: string;
  description: string;
  version: number;
  prefix: string;
  scope: "Parent" | "Child";
  template: string;
  parent: string;
  sampleDir?: string;
}

export class Project {
  static PackagePath = Path.join(process.cwd(), "./package.json");
  static SamplesPath = Path.join(Core.AppPath, "./samples/");

  static getPackage = () => require(Project.PackagePath);

  static create = async () => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking Configuration...",
        task: async (ctx) => {
          // Check Configuration File
          if (!Core.getConfiguration(true)) await Execa("epic", ["init"]);

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
            // Update Package Information
            const Package = Project.getPackage();
            Package.name = configuration?.application?.name || Package.name;
            Package.description =
              configuration?.application?.description || Package.description;
            Package.brand = {
              name:
                configuration?.application?.brand?.name || Package.brand.name,
              country:
                configuration?.application?.brand?.country ||
                Package.brand.country,
              address:
                configuration?.application?.brand?.address ||
                Package.brand.address,
            };

            // Put Package Data
            Fs.writeFileSync(
              Project.PackagePath,
              JSON.stringify(Package, undefined, 2)
            );

            // Re-Create Configuration
            Core.setConfiguration(configuration);

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
              options.sampleDir || Project.SamplesPath,
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
            `import { ${options.name} } from "../../schemas/${options.name}";\n` + // Add Schema Import
            ctx.controllerContent
              .replace(
                /(\/\*(\s*@(Temporary))\s*\*\/)\s*([^]*)\s*(\/\*(\s*\/\3)\s*\*\/)(\r\n|\r|\n)*/g,
                ""
              ) // Remove Temporary Code
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
            `./controllers/v${options.version}/`
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
          if (options.scope === "Child") {
            try {
              // Parent Controller Path
              const ParentControllerPath = Path.join(
                Core.AppPath,
                `./controllers/v${options.version}/${options.parent}.ts`
              );

              // Get Parent Controller Content
              let ParentControllerContent = Fs.readFileSync(
                ParentControllerPath
              ).toString();

              // Modify Parent Controller Content
              ParentControllerContent =
                `import { ${options.name + "Controller"} } from "./${
                  options.name
                }";\n` + // Add Schema Import
                ParentControllerContent.replace(
                  new RegExp(
                    "(\\/\\*(\\s*@(" +
                      options.parent +
                      "ControllerChilds))\\s*\\*\\/)\\s*([^]*)\\s*(\\/\\*(\\s*\\/\\3)\\s*\\*\\/)(\\r\\n|\\r|\\n)*"
                  ),
                  (_, ...args) => {
                    // Parse Controllers List
                    const ControllersList = ((args[3] || "[]") as string)
                      .replace(/\[([^]*)\]/g, "$1")
                      .replace(/\n*\s+/g, " ")
                      .replace(/^\s*|\s*,\s*$/g, "");

                    return `/* @${options.parent}ControllerChilds */ [${
                      ControllersList ? ControllersList + ", " : ""
                    }${options.name + "Controller"}] /* /${
                      options.parent
                    }ControllerChilds */`;
                  }
                );

              // Save Parent Controller Content
              Fs.writeFileSync(ParentControllerPath, ParentControllerContent);
            } catch (e) {
              EpicCli.Logger.warn(
                "We are unable to parse controllers/index properly! Please add the child controller manually."
              ).log();
            }
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
}
