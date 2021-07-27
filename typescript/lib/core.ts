import Path from "path";
import Fs from "fs";
import { EpicCli } from "../cli";

export interface Configuration {
  version: string;
  type: "Application";
}

export interface Transactions {
  version: string;
  data: Array<Transaction>;
}

export interface Transaction {
  command: string;
  params: Record<string, any>;
}

export class Core {
  static RootPath = process.cwd();
  static AppPath = Path.join(process.cwd(), "./src/");

  static DefaultConfig: Configuration = {
    version: "1.0",
    type: "Application",
  };

  static DefaultTransactions: Transactions = {
    version: "1.0",
    data: [],
  };

  static SupportedConfigVersions = ["1.0"];
  static SupportedTransVersions = ["1.0"];

  static getConfiguration = (): Configuration => {
    try {
      return require(Path.join(process.cwd(), "./epic.config.json"));
    } catch (e) {
      EpicCli.Logger.warn(
        "We are unable to find 'epic.config.json' file in your project! Creating new one."
      );

      return Core.DefaultConfig;
    }
  };

  static setConfiguration = (data: Configuration) => {
    Fs.writeFileSync(
      Path.join(process.cwd(), "./epic.config.json"),
      JSON.stringify(data, undefined, 2)
    );
  };

  static getTransactions = (): Transactions => {
    try {
      return require(Path.join(process.cwd(), "./epic.transactions.json"));
    } catch (e) {
      EpicCli.Logger.warn(
        "We are unable to find 'epic.transactions.json' file in your project! Creating new one."
      );

      return Core.DefaultTransactions;
    }
  };

  static setTransactions = (data: Transactions) => {
    Fs.writeFileSync(
      Path.join(process.cwd(), "./epic.transactions.json"),
      JSON.stringify(data, undefined, 2)
    );
  };
}
