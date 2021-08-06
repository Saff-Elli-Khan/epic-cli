import Path from "path";
import Fs from "fs";
import Listr from "listr";
import { Project } from "./project";
import { EpicCli } from "../cli";

export interface ConfigurationInterface {
  version: number;
  paths: PathsInterface;
  application?: ApplicationInterface;
  transactions: Array<TransactionInterface>;
}

export interface PathsInterface {
  samples: string;
  contollers: string;
  schemas: string;
}

export interface ApplicationInterface {
  name: string;
  description: string;
  brand: BrandInterface;
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
    paths: {
      samples: "./src/samples/",
      contollers: "./src/controllers/",
      schemas: "./src/schemas/",
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
          // Update Configuration
          Core.getConfiguration()!.application = {
            name: options.name,
            description: options.description,
            brand: {
              name: options.brandName,
              country: options.brandCountry,
              address: options.brandAddress,
            },
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

  static import = async (options: { path: string }) => {
    // Queue the Tasks
    await new Listr<{ configuration: ConfigurationInterface }>([
      {
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!Fs.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Importing configuration file",
        task: async (ctx) => {
          // Load Configuration File
          ctx.configuration = require(Path.join(Core.RootPath, options.path));
        },
      },
      {
        title: "Executing commands",
        task: async (ctx) => {
          for (const Transaction of ctx.configuration.transactions) {
            // Get Command
            const Command = EpicCli.getCommand(Transaction.command);

            // Execute Command
            await Command.method(Transaction.params, Command);
          }
        },
      },
      {
        title: "Configuring your project",
        task: (ctx) => {
          if (Fs.existsSync(Project.PackagePath)) {
            // Configure Project
            Project.configure(ctx.configuration);
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
