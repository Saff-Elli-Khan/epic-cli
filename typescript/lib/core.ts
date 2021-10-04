import Listr from "listr";
import { EpicConfigManager } from "@saffellikhan/epic-config-manager";

export type FrameworkType = "Express";

export type ProjectType = "Application" | "Plugin";

export type ResourceType = "controller" | "schema" | "middleware";

export interface ConfigurationInterface {
  version: number;
  framework: FrameworkType;
  type: ProjectType;
  name: string;
  description: string;
  brand: BrandInterface;
  paths?: PathsInterface;
  lastAccess?: AccessInterface;
}

export type AccessInterface = {
  [key in ResourceType]?: string;
};

export interface PathsInterface {
  templates?: string;
  contollers?: string;
  schemas?: string;
  middlewares?: string;
}

export interface BrandInterface {
  name: string;
  country: string;
  address: string;
}

export interface TransactionsInterface {
  version: number;
  transactions: Array<TransactionInterface>;
}

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
      name: "my-project",
      description: "This is my project.",
      brand: {
        name: "My Company",
        country: "Pakistan",
        address: "House #22, Multan",
      },
    },
    transactions: {
      version: 1,
      transactions: [],
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

    return {
      ...data,
      paths: {
        templates: data.paths?.templates || "./src/templates/",
        contollers: data.paths?.contollers || "./src/controllers/",
        middlewares: data.paths?.middlewares || "./src/middlewares/",
        schemas: data.paths?.schemas || "./src/schemas/",
      },
      lastAccess: {
        ...data.lastAccess,
      },
    };
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
            );

            // Execute Command
            await Command.method(Transaction.params, Command);
          }
        },
      },
    ]).run();
  }
}
