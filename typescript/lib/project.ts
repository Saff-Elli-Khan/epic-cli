import Execa from "execa";
import Listr from "listr";
import Path from "path";
import Fs from "fs";

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
  type: "Core" | "Custom";
  scope: "Parent" | "Child";
}

export class Project {
  static PackagePath = Path.join(process.cwd(), "./package.json");
  static Package = require(Project.PackagePath);

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
            Project.Package.name = options.name;
            Project.Package.description = options.description;
            Project.Package.brand = {
              name: options.brandName,
              country: options.brandCountry,
              address: options.brandAddress,
            };

            // Put Package Data
            Fs.writeFileSync(
              Project.PackagePath,
              JSON.stringify(Project.Package, undefined, 2)
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

  static createController = async (options: CreateControllerOptions) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Loading controller sample",
        task: (ctx) => {},
      },
    ]).run();
  };
}
