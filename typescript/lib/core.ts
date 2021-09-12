import Path from "path";
import Fs from "fs";
import Listr from "listr";
import { EpicCli } from "../cli";
import { EpicConfigManager } from "epic-config-manager";

export type ProjectType = "Application" | "Plugin";

export type FrameworkType = "Express";

export interface ConfigurationInterface {
  version: number;
  type: ProjectType;
  framework: FrameworkType;
  name: string;
  description: string;
  history: HistoryInterface;
  brand: BrandInterface;
  paths: PathsInterface;
  transactions: Array<TransactionInterface>;
}

export interface HistoryInterface {
  controller: string | null;
  schema: string | null;
  middleware: string | null;
}

export interface PathsInterface {
  samples: string;
  contollers: string;
  schemas: string;
  middlewares: string;
}

export interface BrandInterface {
  name: string;
  country: string;
  address: string;
}

export interface TransactionInterface {
  command: string;
  params: Record<string, any>;
}

export interface InitializationOptions {
  type: ProjectType;
  name: string;
  description: string;
  brandName: string;
  brandCountry: string;
  brandAddress: string;
}

export const ConfigManager = new EpicConfigManager<ConfigurationInterface>({
  version: 1,
  type: "Application",
  framework: "Express",
  name: "demo-project",
  description: "This is a demo project.",
  history: {
    controller: null,
    schema: null,
    middleware: null,
  },
  brand: {
    name: "Demo Company",
    country: "Pakistan",
    address: "House #22, Multan",
  },
  paths: {
    samples: "./src/samples/",
    contollers: "./src/controllers/",
    schemas: "./src/schemas/",
    middlewares: "./src/middlewares/",
  },
  transactions: [],
});

export class Core {
  static PackagePath = Path.join(
    ConfigManager.Options.rootPath,
    "./package.json"
  );

  static EnvironmentsPath = Path.join(ConfigManager.Options.rootPath, "./env/");

  static AppPath = Path.join(ConfigManager.Options.rootPath, "./src/");

  static getPackage() {
    return require(this.PackagePath);
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
    Fs.writeFileSync(this.PackagePath, JSON.stringify(Package, undefined, 2));

    // Re-Create Configuration
    ConfigManager.setConfig(Configuration);

    // Create Environment Directory
    Fs.mkdirSync(this.EnvironmentsPath, {
      recursive: true,
    });
  }

  static initialize = async (options: InitializationOptions) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating or Updating configuration...",
        task: () => {
          // Set New Configuration
          ConfigManager.setConfig({
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
          if (Fs.existsSync(this.PackagePath)) {
            // Configure Project
            this.configure(ConfigManager.getConfig());
          }
        },
      },
    ]).run();
  };

  static install = async () => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!ConfigManager.hasConfig())
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Executing commands",
        task: async () => {
          // Get Configuration
          const Configuration = ConfigManager.getConfig();

          // Execute Each Transaction
          for (const Transaction of Configuration.transactions) {
            // Get Command
            const Command = EpicCli.getCommand(Transaction.command);

            // Execute Command
            await Command.method(Transaction.params, Command);
          }
        },
      },
    ]).run();
  };
}
