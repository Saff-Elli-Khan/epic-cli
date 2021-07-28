import Path from "path";
import Fs from "fs";
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

  static initialize = (options: InitializationOptions) => {
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

    // Set New Configuration
    Core.setConfiguration(Core.DefaultConfig);

    // Success Log
    EpicCli.Logger.success(
      "Configuration has been successfully created!"
    ).log();
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
