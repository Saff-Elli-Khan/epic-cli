import Path from "path";
import Fs from "fs";
import { EpicCli } from "../cli";

export interface Configuration {
  version: number;
  application?: Application;
  transactions: Array<Transaction>;
}

export interface Application {
  name: string;
  description: string;
  brand: Brand;
}

export interface Brand {
  name: string;
  country: string;
  address: string;
}

export interface Transaction {
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
  static AppPath = Path.join(process.cwd(), "./src/");

  static DefaultConfig: Configuration = {
    version: 1,
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
  };

  static getConfiguration = (strict = false): Configuration | null => {
    try {
      return require(Path.join(Core.RootPath, "./epic.config.json"));
    } catch (e) {
      if (strict) return null;
      else return Core.DefaultConfig;
    }
  };

  static setConfiguration = (data: Configuration) => {
    Fs.writeFileSync(
      Path.join(Core.RootPath, "./epic.config.json"),
      JSON.stringify(data, undefined, 2)
    );
  };

  static removeConfiguration = () => {
    Fs.unlinkSync(Path.join(Core.RootPath, "./epic.config.json"));
  };
}
