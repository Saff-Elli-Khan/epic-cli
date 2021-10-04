import { EpicCli } from "../cli";
import { EpicConfigManager } from "@saffellikhan/epic-config-manager";
import Listr from "listr";

export type FrameworkType = "Express";

export type ProjectType = "Application" | "Plugin";

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

export interface AccessInterface {
  controller?: string;
  schema?: string;
  middleware?: string;
}

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

export const ConfigManager = new EpicConfigManager({
  configFileNames: {
    main: "epic.config.json",
    transactions: "epic.transactions.json",
  },
})
  .init<{
    main: ConfigurationInterface;
    transactions: TransactionsInterface;
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
  })
  .override("main", (data) => ({
    ...data,
    paths: {
      templates: data.paths?.templates || "./templates/",
      contollers: data.paths?.contollers || "./src/controllers/",
      middlewares: data.paths?.middlewares || "./src/middlewares/",
      schemas: data.paths?.schemas || "./src/schemas/",
    },
    lastAccess: {
      ...data.lastAccess,
    },
  }));

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
            const Command = EpicCli.getCommand(Transaction.command);

            // Execute Command
            await Command.method(Transaction.params, Command);
          }
        },
      },
    ]).run();
  }
}
