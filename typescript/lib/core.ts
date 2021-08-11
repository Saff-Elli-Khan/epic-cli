import Path from "path";
import Fs from "fs";
import Listr from "listr";
import { Project } from "./project";
import { EpicCli } from "../cli";

export type ProjectType = "Application" | "Plugin";

export interface ConfigurationInterface {
  version: number;
  type: ProjectType;
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

export class Core {
  static RootPath = process.cwd();

  static ConfigFileName = "epic.config.json";

  static ConfigFilePath = () => Path.join(Core.RootPath, Core.ConfigFileName);

  static DefaultConfig: ConfigurationInterface = {
    version: 1,
    type: "Application",
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
  };

  static SupportedConfigVersions = [1];

  static initialize = async (options: InitializationOptions) => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Creating/Updating configuration...",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Update Configuration
          Configuration.type = options.type;
          Configuration.name = options.name;
          Configuration.description = options.description;
          Configuration.brand = {
            name: options.brandName,
            country: options.brandCountry,
            address: options.brandAddress,
          };
        },
      },
      {
        title: "Saving Configuration",
        task: () => {
          // Set New Configuration
          Core.setConfiguration(Core.DefaultConfig);
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          if (Fs.existsSync(Project.PackagePath)) {
            // Configure Project
            Project.configure(Core.getConfiguration()!);
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
          if (!Fs.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Executing commands",
        task: async () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

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

  static getConfiguration = (strict = false): ConfigurationInterface | null => {
    try {
      const Configuration = (Core.DefaultConfig = require(Core.ConfigFilePath())) as ConfigurationInterface;
      if (Core.SupportedConfigVersions.includes(Configuration.version))
        return Configuration;
      else {
        EpicCli.Logger.error(
          `Configuration version is not supported by the current CLI version!`
        ).log();

        throw new Error(`Configuration version not supported!`);
      }
    } catch (e) {
      if (strict) return null;
      else return Core.DefaultConfig;
    }
  };

  static setConfiguration = (data: ConfigurationInterface) => {
    Fs.writeFileSync(Core.ConfigFilePath(), JSON.stringify(data, undefined, 2));
  };

  static removeConfiguration = () => {
    Fs.unlinkSync(Core.ConfigFilePath());
  };
}
