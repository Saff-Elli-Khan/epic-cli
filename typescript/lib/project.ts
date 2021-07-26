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

export class Project {
  static create = async (options: CreateOptions) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Cloning repository to current directory!",
        task: () =>
          Execa("git", [
            "clone",
            "https://github.com/Saff-Elli-Khan/epic-application",
            ".",
          ]),
      },
      {
        title: "Update project information",
        task: () => {
          // Check if package.json exists
          const PackagePath = Path.join(process.cwd(), "./package.json");

          if (Fs.existsSync(PackagePath)) {
            const Package = require(PackagePath);

            // Update Package Information
            Package.name = options.name;
            Package.description = options.description;
            Package.brand = {
              name: options.brandName,
              country: options.brandCountry,
              address: options.brandAddress,
            };

            // Put Package Data
            Fs.writeFileSync(
              PackagePath,
              JSON.stringify(Package, undefined, 2)
            );
          } else
            throw new Error(`We are unable to update project information!`);
        },
      },
      {
        title: "Install package dependencies with Yarn",
        task: (ctx, task) =>
          Execa("yarn").catch(() => {
            ctx.yarn = false;

            task.skip(
              "Yarn not available, install it via `npm install -g yarn`"
            );
          }),
      },
      {
        title: "Install package dependencies with npm",
        enabled: (ctx) => ctx.yarn === false,
        task: () => Execa("npm", ["install"]),
      },
    ]).run();

    return true;
  };
}
