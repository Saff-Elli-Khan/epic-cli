import Path from "path";
import Fs from "fs";
import Listr from "listr";
import { Project } from "./project";

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

  static getConfiguration = (strict = false): ConfigurationInterface | null => {
    try {
      return (Core.DefaultConfig = require(Path.join(
        Core.RootPath,
        "./epic.config.json"
      )));
    } catch (e) {
      if (strict) return null;
      else return Core.DefaultConfig;
    }
  };

  static setConfiguration = (data: ConfigurationInterface) => {
    Fs.writeFileSync(
      Path.join(Core.RootPath, "./epic.config.json"),
      JSON.stringify(data, undefined, 2)
    );
  };

  static removeConfiguration = () => {
    Fs.unlinkSync(Path.join(Core.RootPath, "./epic.config.json"));
  };
}
