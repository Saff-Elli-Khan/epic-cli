import Listr from "listr";
import { EpicConfigManager } from "@saffellikhan/epic-config-manager";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";

export type FrameworkType = "Express";

export type ProjectType = "Application" | "Plugin";

export type ResourceType = "controller" | "model" | "middleware";

export type PackageManagerType = "npm" | "yarn";

export interface DatabaseConnectionDetails {
  host: string;
  port: number;
  user: string;
  password: string;
  dbname: string;
  limit?: number;
}

export interface ConfigurationInterface {
  version: number;
  framework: FrameworkType;
  type: ProjectType;
  packageManager: PackageManagerType;
  name: string;
  description: string;
  brand: BrandInterface;
  database: DatabaseConnectionDetails;
  plugins: Record<string, string>;
  paths: PathsInterface;
}

export interface PathsInterface {
  templates?: string;
  contollers?: string;
  models?: string;
  middlewares?: string;
}

export interface BrandInterface {
  name: string;
  country: string;
  address: string;
}

export interface TransactionsInterface {
  version: number;
  lastAccess: AccessInterface;
  transactions: Array<TransactionInterface>;
}

export type AccessInterface = {
  [key in ResourceType]?: string;
};

export interface TransactionInterface {
  command: string;
  params: Record<string, any>;
}

export interface ResourcesInterface {
  version: number;
  resources: Array<ResourceInterface>;
}

export interface ResourceInterface {
  type: ResourceType;
  name: string;
  parent?: string;
}

export const ConfigManager = new EpicConfigManager({
  configFileNames: {
    main: "epic.config.json",
    transactions: "epic.transactions.json",
    resources: "epic.resources.json",
  },
})
  .init<{
    main: ConfigurationInterface;
    transactions: TransactionsInterface;
    resources: ResourcesInterface;
  }>({
    main: {
      version: 1,
      framework: "Express",
      type: "Application",
      packageManager: "npm",
      name: "my-project",
      description: "This is my project.",
      brand: {
        name: "My Company",
        country: "Pakistan",
        address: "House #22, Multan",
      },
      database: {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "",
        dbname: "test",
      },
      plugins: {},
      paths: {
        templates: "./src/templates/",
        contollers: "./src/controllers/",
        middlewares: "./src/middlewares/",
        models: "./src/models/",
      },
    },
    transactions: {
      version: 1,
      transactions: [],
      lastAccess: {},
    },
    resources: {
      version: 1,
      resources: [],
    },
  })
  .override("main", (data) => {
    // Check Configuration Version
    if (data.version !== 1)
      throw new Error(
        `Invalid configuration version! Currently installed CLI expects epic.config version 1.`
      );

    return data;
  })
  .override("transactions", (data) => {
    // Check Transactions Version
    if (data.version !== 1)
      throw new Error(
        `Invalid transactions version! Currently installed CLI expects epic.transactions version 1.`
      );

    return data;
  })
  .override("resources", (data) => {
    // Check Transactions Version
    if (data.version !== 1)
      throw new Error(
        `Invalid resources version! Currently installed CLI expects epic.resources version 1.`
      );

    return data;
  });

export class Core {
  static async install() {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!ConfigManager.hasConfig("transactions"))
            throw new Error("No Transactions found on the project!");
        },
      },
      {
        title: "Executing commands",
        task: async () => {
          // Get Configuration
          const Transactions = ConfigManager.getConfig("transactions");

          // Execute Each Transaction
          for (const Transaction of Transactions.transactions) {
            // Get Command
            const Command = require("../make-cli").EpicCli.getCommand(
              Transaction.command
            ) as CommandInterface;

            // Change Command Source
            Command.source = "Manual";

            // Execute Command
            await Command.method(Transaction.params, Command);
          }
        },
      },
    ]).run();
  }
}
