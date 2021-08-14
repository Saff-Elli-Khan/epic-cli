import Execa from "execa";
import Listr from "listr";
import Path from "path";
import Fs from "fs";
import { CommandInterface } from "@saffellikhan/epic-cli-builder";
import { Parser } from "@saffellikhan/epic-parser";
import { ConfigurationInterface, Core, TransactionInterface } from "./core";
import { generateRandomKey } from "./utils";
import { EpicCli } from "../cli";

export interface CreateControllerOptions {
  name: string;
  description: string;
  prefix: string;
  template: string;
  parent: string;
  sampleDir?: string;
}

export interface DeleteControllerOptions {
  name: string;
}

export interface CreateSchemaOptions {
  name: string;
  description: string;
  template: string;
  sampleDir?: string;
}

export interface DeleteSchemaOptions {
  name: string;
}

export interface CreateMiddlewareOptions {
  type: "Global" | "Local";
  name: string;
  description: string;
  template: string;
  sampleDir?: string;
}

export interface DeleteMiddlewareOptions {
  name: string;
}

export interface CreateSchemaColumnOptions {
  schema: string;
  type:
    | "String"
    | "Number"
    | "Boolean"
    | "Enum"
    | "Record"
    | "Array"
    | "Relation";
  choices?: string[];
  arrayof?: "String" | "Number" | "Boolean" | "Record" | "Relation";
  recordType?: string;
  length?: number;
  relation?: string;
  mapping?: string[];
  name: string;
  nullable?: boolean;
  defaultValue?: string;
  collation?: string;
  index?: ("FULLTEXT" | "UNIQUE" | "INDEX" | "SPATIAL")[];
  onUpdate?: string;
}

export interface DeleteSchemaColumnOptions {
  schema: string;
  name: string;
}

export class Project {
  static PackagePath = Path.join(Core.RootPath, "./package.json");
  static EnvironmentsPath = Path.join(Core.RootPath, "./env/");
  static AppPath = Path.join(Core.RootPath, "./src/");

  static SamplesPath = Path.join(
    Core.RootPath,
    Core.getConfiguration()!.paths.samples
  );
  static ControllersPath = Path.join(
    Core.RootPath,
    Core.getConfiguration()!.paths.contollers
  );
  static SchemasPath = Path.join(
    Core.RootPath,
    Core.getConfiguration()!.paths.schemas
  );
  static MiddlewaresPath = Path.join(
    Core.RootPath,
    Core.getConfiguration()!.paths.middlewares
  );

  static getPackage = () => require(Project.PackagePath);

  static configure = (Configuration: ConfigurationInterface) => {
    // Get Package Information
    const Package = Project.getPackage();

    // Update Package Information
    Package.name = Configuration?.name || Package.name;
    Package.description = Configuration?.description || Package.description;
    Package.private = Configuration.type === "Application";

    if (Configuration.type === "Plugin") {
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
    Fs.writeFileSync(
      Project.PackagePath,
      JSON.stringify(Package, undefined, 2)
    );

    // Re-Create Configuration
    Core.setConfiguration(Configuration);

    // Create Environment Directory
    Fs.mkdirSync(Project.EnvironmentsPath, {
      recursive: true,
    });
  };

  static create = async () => {
    // Queue the Tasks
    await new Listr([
      {
        title: "Checking configuration...",
        task: async (ctx) => {
          // Check Configuration File
          if (!Core.getConfiguration(true))
            await Execa("epic", ["init", "--yes"]);

          // Get Configuration
          ctx.configuration = Core.getConfiguration();

          // Remove Configuration
          Core.removeConfiguration();
        },
      },
      {
        title: "Cloning repository to current directory",
        task: async () => {
          // Clone Repository
          await Execa("git", [
            "clone",
            "https://github.com/Saff-Elli-Khan/epic-application",
            ".",
          ]);

          // Remove .git folder
          await Execa("npx", ["rimraf", "./.git"]);

          // Initialize New Repository
          await Execa("git", ["init"]);
        },
      },
      {
        title: "Configuring your project",
        task: ({ configuration }) => {
          if (Fs.existsSync(Project.PackagePath)) {
            // Configure Project
            Project.configure(configuration);

            // Create Environment Files
            ["development", "production"].forEach((env) =>
              Fs.writeFileSync(
                Path.join(Project.EnvironmentsPath, `./.${env}.env`),
                `ENCRYPTION_KEY=${generateRandomKey(32)}`
              )
            );
          } else
            throw new Error(
              `We did not found a 'package.json' in the project!`
            );
        },
      },
      {
        title: "Installing package dependencies with Yarn",
        task: (ctx, task) =>
          Execa("yarn").catch(() => {
            ctx.yarn = false;

            task.skip(
              "Yarn not available, install it via `npm install -g yarn`"
            );
          }),
      },
      {
        title: "Installing package dependencies with npm",
        enabled: (ctx) => ctx.yarn === false,
        task: () => Execa("npm", ["install"]),
      },
    ]).run();

    return true;
  };

  static createController = async (
    options: CreateControllerOptions,
    command: CommandInterface
  ) => {
    // Queue the Tasks
    await new Listr<{ controllerContent: string }>([
      {
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!Fs.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Loading controller sample",
        task: (ctx) => {
          try {
            // Load Controller
            ctx.controllerContent = Fs.readFileSync(
              Path.join(
                options.sampleDir || Project.ControllersPath,
                `./${options.name}.ts`
              )
            ).toString();
          } catch (e) {
            // Load Controller Sample
            ctx.controllerContent = Fs.readFileSync(
              Path.join(
                options.sampleDir || Project.SamplesPath,
                options.sampleDir
                  ? `./${options.template}.ts`
                  : `./controller/${options.template}.ts`
              )
            ).toString();
          }
        },
      },
      {
        title: "Preparing the Controller",
        task: (ctx) => {
          // Create Relative Path to Schemas
          const SchemaPath = Path.relative(
            Project.ControllersPath,
            Path.join(Project.SchemasPath, options.name)
          ).replace(/\\/g, "/");

          // Create Relative Path To App
          const AppPath = Path.relative(
            Project.ControllersPath,
            Project.AppPath
          ).replace(/\\/g, "/");

          // Parse Template
          const Parsed = new Parser(
            ctx.controllerContent
              .replace(/@AppPath/g, AppPath) // Add App Path
              .replace("{ControllerPrefix}", options.prefix) // Add Controler Prefix
              .replace(/Sample/g, options.name) // Add Name
          ).parse();

          // Push Import
          Parsed.push(
            "ImportsContainer",
            "ImportsTemplate",
            options.name + "Import",
            {
              modules: [options.name],
              location: SchemaPath,
            }
          );

          // Update Controller Sample
          ctx.controllerContent = Parsed.render();
        },
      },
      {
        title: "Creating New Controller",
        task: ({ controllerContent }: { controllerContent: string }) => {
          // Resolve Directory
          Fs.mkdirSync(Project.ControllersPath, { recursive: true });

          // Create Controller
          Fs.writeFileSync(
            Path.join(Project.ControllersPath, `./${options.name}.ts`),
            controllerContent
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          try {
            // Parent Controller Path
            const ParentControllerPath = Path.join(
              Project.ControllersPath,
              `./${options.parent}.ts`
            );

            // Get Parent Controller Content & Parse Template
            const Parsed = new Parser(
              Fs.readFileSync(ParentControllerPath).toString()
            ).parse();

            // Push Import
            Parsed.push(
              "ImportsContainer",
              "ImportsTemplate",
              options.name + "Import",
              {
                modules: [options.name + "Controller"],
                location: `./${options.name}`,
              }
            );

            // Push Child Controller
            Parsed.push(
              "ControllerChildsContainer",
              "ControllerChildsListTemplate",
              options.name + "ControllerChilds",
              {
                child: options.name + "Controller",
              }
            );

            // Save Parent Controller Content
            Fs.writeFileSync(ParentControllerPath, Parsed.render());
          } catch (e) {
            EpicCli.Logger.warn(
              "We are unable to parse controllers/index properly! Please add the child controller manually."
            ).log();
          }

          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Update History
          Configuration.history.controller = options.name;

          // Remove Duplicate Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-controller" &&
                transaction.params.name === options.name
              )
          );

          // Update Transactions
          Configuration.transactions.push({
            command: command.name,
            params: options,
          });

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };

  static deleteController = async (options: DeleteControllerOptions) => {
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
        title: "Deleting the controller",
        task: async () => {
          // Delete Controller
          Fs.unlinkSync(
            Path.join(Project.ControllersPath, `./${options.name}.ts`)
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Find Create Controller Transaction related to this Controller
          const Transaction = Configuration.transactions.reduce<TransactionInterface | null>(
            (result, transaction) =>
              result
                ? result
                : transaction.command === "create-controller" &&
                  transaction.params.name === options.name
                ? transaction
                : null,
            null
          );

          // If Transaction Exists
          if (Transaction) {
            try {
              // Parent Controller Path
              const ParentControllerPath = Path.join(
                Project.ControllersPath,
                `./${Transaction.params.parent}.ts`
              );

              // Get Parent Controller Content & Parse Template
              const Parsed = new Parser(
                Fs.readFileSync(ParentControllerPath).toString()
              ).parse();

              // Remove Child Controller Import
              Parsed.pop("ImportsContainer", options.name + "Import");

              // Remove Child Controller
              Parsed.pop(
                "ControllerChildsContainer",
                options.name + "ControllerChilds"
              );

              // Save Parent Controller Content
              Fs.writeFileSync(ParentControllerPath, Parsed.render());
            } catch (e) {
              EpicCli.Logger.warn(
                `We are unable to parse controllers/index properly! Please remove the child controller from "${Transaction.params.parent}" manually.`
              ).log();
            }
          }

          // Update History
          Configuration.history.controller = options.name;

          // Remove Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-controller" &&
                transaction.params.name === options.name
              )
          );

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };

  static createSchema = async (
    options: CreateSchemaOptions,
    command: CommandInterface
  ) => {
    // Queue the Tasks
    await new Listr<{ schemaContent: string; schemasContainerContent: string }>(
      [
        {
          title: "Checking configuration...",
          task: async () => {
            // Check Configuration File
            if (!Fs.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
              throw new Error("Please initialize a project first!");
          },
        },
        {
          title: "Loading schema sample & container",
          task: (ctx) => {
            try {
              // Load Schema
              ctx.schemaContent = Fs.readFileSync(
                Path.join(
                  options.sampleDir || Project.SchemasPath,
                  `./${options.name}.ts`
                )
              ).toString();
            } catch (e) {
              // Load Schema Sample
              ctx.schemaContent = Fs.readFileSync(
                Path.join(
                  options.sampleDir || Project.SamplesPath,
                  options.sampleDir
                    ? `./${options.template}.ts`
                    : `./schema/${options.template}.ts`
                )
              ).toString();
            }

            // Load Schemas Container
            ctx.schemasContainerContent = Fs.readFileSync(
              Path.join(Project.SchemasPath, `./index.ts`)
            ).toString();
          },
        },
        {
          title: "Preparing the schema & container",
          task: (ctx) => {
            // Create Relative Path To App
            const AppPath = Path.relative(
              Project.SchemasPath,
              Project.AppPath
            ).replace(/\\/g, "/");

            // Parse Schema Template
            const ParsedSchema = new Parser(
              ctx.schemaContent
                .replace(/@AppPath/g, AppPath) // Add App Path
                .replace(/Sample/g, options.name) // Add Name
            ).parse();

            // Parse Schema Container Template
            const ParsedSchemasContainer = new Parser(
              ctx.schemasContainerContent
            ).parse();

            // Import Schema
            ParsedSchemasContainer.push(
              "ImportsContainer",
              "ImportsTemplate",
              options.name + "Import",
              {
                modules: options.name,
                location: `./${options.name}`,
              }
            );

            // Add Schema to Container
            ParsedSchemasContainer.push(
              "SchemasContainer",
              "SchemaTemplate",
              options.name + "Schema",
              { schema: options.name }
            );

            // Update Schema Sample
            ctx.schemaContent = ParsedSchema.render();

            // Update Container
            ctx.schemasContainerContent = ParsedSchemasContainer.render();
          },
        },
        {
          title: "Creating New Schema",
          task: ({ schemaContent, schemasContainerContent }) => {
            // Resolve Directory
            Fs.mkdirSync(Project.SchemasPath, { recursive: true });

            // Create Schema
            Fs.writeFileSync(
              Path.join(Project.SchemasPath, `./${options.name}.ts`),
              schemaContent
            );

            // Update Schemas Container
            Fs.writeFileSync(
              Path.join(Project.SchemasPath, `./index.ts`),
              schemasContainerContent
            );
          },
        },
        {
          title: "Configuring your project",
          task: () => {
            // Get Configuration
            const Configuration = Core.getConfiguration()!;

            // Remove Duplicate Transaction
            Configuration.transactions = Configuration.transactions.filter(
              (transaction) =>
                !(
                  transaction.command === "create-schema" &&
                  transaction.params.name === options.name
                )
            );

            // Update History
            Configuration.history.schema = options.name;

            // Update Transactions
            Configuration.transactions.push({
              command: command.name,
              params: options,
            });

            // Set Transactions
            Core.setConfiguration(Configuration);
          },
        },
      ]
    ).run();
  };

  static deleteSchema = async (options: DeleteSchemaOptions) => {
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
        title: "Deleting the schema",
        task: async () => {
          // Delete Schema
          Fs.unlinkSync(Path.join(Project.SchemasPath, `./${options.name}.ts`));
        },
      },
      {
        title: "Updating schema container",
        task: async () => {
          // Load Schemas Container
          const SchemasContainer = Fs.readFileSync(
            Path.join(Project.SchemasPath, `./index.ts`)
          ).toString();

          // Parse Template
          const Parsed = new Parser(SchemasContainer).parse();

          // Import Schema
          Parsed.pop("ImportsContainer", options.name + "Import");

          // Add Schema to Container
          Parsed.pop("SchemasContainer", options.name + "Schema");

          // Update Schemas Container
          Fs.writeFileSync(
            Path.join(Project.SchemasPath, `./index.ts`),
            Parsed.render()
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Remove Schema Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-schema" &&
                transaction.params.name === options.name
              )
          );

          // Update History
          Configuration.history.schema = options.name;

          // Remove Column Transactions
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-schema-column" &&
                transaction.params.schema === options.name
              )
          );

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };

  static createSchemaColumn = async (
    options: CreateSchemaColumnOptions,
    command: CommandInterface
  ) => {
    // Queue the Tasks
    await new Listr<{ schemaContent: string }>([
      {
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!Fs.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Loading schema",
        task: (ctx) => {
          // Load Schema Sample
          ctx.schemaContent = Fs.readFileSync(
            Path.join(Project.SchemasPath, `./${options.schema}.ts`)
          ).toString();
        },
      },
      {
        title: "Preparing the Schema",
        task: (ctx) => {
          // Parse Template
          const Parsed = new Parser(ctx.schemaContent).parse();

          // Push Relation Import
          if (options.relation)
            Parsed.push(
              "ImportsContainer",
              "ImportsTemplate",
              options.relation + "Import",
              {
                modules: [options.relation],
                location: `./${options.relation}`,
              }
            );

          // Push Column
          Parsed.push(
            "ColumnsContainer",
            options.relation
              ? options.arrayof === "Relation"
                ? "ManyRelationTemplate"
                : "OneRelationTemplate"
              : "ColumnTemplate",
            options.name + "Column",
            {
              name: options.name,
              datatype:
                options.type === "Array"
                  ? `Array<${
                      options.arrayof === "Record"
                        ? `Record<string, ${options.recordType || "any"}>`
                        : options.arrayof?.toLowerCase()
                    }>`
                  : options.type === "Enum"
                  ? `"${options.choices?.join('" | "')}"`
                  : options.type === "Record"
                  ? `Record<string, ${options.recordType || "any"}>`
                  : options.type.toLowerCase(),
              options: `{${
                options.length !== undefined && options.length !== 50
                  ? `\nlength: ${options.length || null},`
                  : ""
              }${
                options.collation !== undefined &&
                options.collation !== "utf8mb4_unicode_ci"
                  ? `\ncollation: "${options.collation}",`
                  : ""
              }${
                options.choices
                  ? `\nchoices: ["${options.choices.join('", "')}"],`
                  : ""
              }${options.nullable ? `\nnullable: true,` : ""}${
                options.index?.length
                  ? `\nindex: ["${options.index.join('", "')}"],`
                  : ""
              }${
                options.defaultValue
                  ? `\ndefaultValue: ${options.defaultValue},`
                  : ""
              }${
                options.onUpdate ? `\nonUpdate: ${options.onUpdate},` : ""
              }\n}`,
              schema: options.schema,
              relation: options.relation,
              mapping: JSON.stringify(options.mapping),
            }
          );

          // Updated Schema
          ctx.schemaContent = Parsed.render();
        },
      },
      {
        title: "Creating New Column",
        task: ({ schemaContent }) => {
          // Resolve Directory
          Fs.mkdirSync(Project.SchemasPath, { recursive: true });

          // Create Schema
          Fs.writeFileSync(
            Path.join(Project.SchemasPath, `./${options.schema}.ts`),
            schemaContent
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Remove Duplicate Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-schema-column" &&
                transaction.params.schema === options.schema &&
                transaction.params.name === options.name
              )
          );

          // Update History
          Configuration.history.schema = options.schema;

          // Update Transactions
          Configuration.transactions.push({
            command: command.name,
            params: options,
          });

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };

  static deleteSchemaColumn = async (options: DeleteSchemaColumnOptions) => {
    // Queue the Tasks
    await new Listr<{ schemaContent: string }>([
      {
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!Fs.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Loading the schema",
        task: (ctx) => {
          // Load Schema Sample
          ctx.schemaContent = Fs.readFileSync(
            Path.join(Project.SchemasPath, `./${options.schema}.ts`)
          ).toString();
        },
      },
      {
        title: "Deleting the column",
        task: async (ctx) => {
          // Parse Template
          const Parsed = new Parser(ctx.schemaContent).parse();

          // Delete Schema Column
          Parsed.pop("ColumnsContainer", options.name + "Column");

          // Updated Schema
          ctx.schemaContent = Parsed.render();
        },
      },
      {
        title: "Saving the schema",
        task: ({ schemaContent }) => {
          // Save Schema
          Fs.writeFileSync(
            Path.join(Project.SchemasPath, `./${options.schema}.ts`),
            schemaContent
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Update History
          Configuration.history.schema = options.schema;

          // Remove Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-schema-column" &&
                transaction.params.schema === options.schema &&
                transaction.params.name === options.name
              )
          );

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };

  static createMiddleware = async (
    options: CreateMiddlewareOptions,
    command: CommandInterface
  ) => {
    // Queue the Tasks
    await new Listr<{
      middlewareContent: string;
      middlewaresContainerContent?: string;
    }>([
      {
        title: "Checking configuration...",
        task: async () => {
          // Check Configuration File
          if (!Fs.readdirSync(Core.RootPath).includes(Core.ConfigFileName))
            throw new Error("Please initialize a project first!");
        },
      },
      {
        title: "Loading middleware sample & container",
        task: (ctx) => {
          try {
            // Load Middleware
            ctx.middlewareContent = Fs.readFileSync(
              Path.join(
                options.sampleDir || Project.MiddlewaresPath,
                `./${options.name}.ts`
              )
            ).toString();
          } catch (e) {
            // Load Middleware Sample
            ctx.middlewareContent = Fs.readFileSync(
              Path.join(
                options.sampleDir || Project.SamplesPath,
                options.sampleDir
                  ? `./${options.template}.ts`
                  : `./middleware/${options.template}.ts`
              )
            ).toString();
          }

          // Load Middlewares Container
          if (options.type === "Global")
            ctx.middlewaresContainerContent = Fs.readFileSync(
              Path.join(Project.MiddlewaresPath, `./index.ts`)
            ).toString();
        },
      },
      {
        title: "Preparing the middleware & container",
        task: (ctx) => {
          // Create Relative Path To App
          const AppPath = Path.relative(
            Project.MiddlewaresPath,
            Project.AppPath
          ).replace(/\\/g, "/");

          // Parse Middleware Template
          const ParsedMiddleware = new Parser(
            ctx.middlewareContent
              .replace(/@AppPath/g, AppPath) // Add App Path
              .replace(/Sample/g, options.name) // Add Name
          ).parse();

          if (options.type === "Global") {
            // Parse Middleware Container Template
            const ParsedMiddlewaresContainer = new Parser(
              ctx.middlewaresContainerContent!
            ).parse();

            // Import Middleware
            ParsedMiddlewaresContainer.push(
              "ImportsContainer",
              "ImportsTemplate",
              options.name + "Import",
              {
                modules: options.name + "Middleware",
                location: `./${options.name}`,
              }
            );

            // Add Middleware to Container
            ParsedMiddlewaresContainer.push(
              "MiddlewaresContainer",
              "MiddlewareTemplate",
              options.name + "Middleware",
              { middleware: options.name + "Middleware" }
            );

            // Update Container
            ctx.middlewaresContainerContent = ParsedMiddlewaresContainer.render();
          }

          // Update Middleware Sample
          ctx.middlewareContent = ParsedMiddleware.render();
        },
      },
      {
        title: "Creating New Middleware",
        task: ({ middlewareContent, middlewaresContainerContent }) => {
          // Resolve Directory
          Fs.mkdirSync(Project.MiddlewaresPath, { recursive: true });

          // Create Middleware
          Fs.writeFileSync(
            Path.join(Project.MiddlewaresPath, `./${options.name}.ts`),
            middlewareContent
          );

          // Update Middlewares Container
          if (options.type === "Global")
            Fs.writeFileSync(
              Path.join(Project.MiddlewaresPath, `./index.ts`),
              middlewaresContainerContent!
            );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Remove Duplicate Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-middleware" &&
                transaction.params.name === options.name
              )
          );

          // Update History
          Configuration.history.middleware = options.name;

          // Update Transactions
          Configuration.transactions.push({
            command: command.name,
            params: options,
          });

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };

  static deleteMiddleware = async (options: DeleteMiddlewareOptions) => {
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
        title: "Deleting the middleware",
        task: async () => {
          // Delete Middleware
          Fs.unlinkSync(
            Path.join(Project.MiddlewaresPath, `./${options.name}.ts`)
          );
        },
      },
      {
        title: "Updating middleware container",
        task: async () => {
          // Load Middlewares Container
          const MiddlewaresContainer = Fs.readFileSync(
            Path.join(Project.MiddlewaresPath, `./index.ts`)
          ).toString();

          // Parse Template
          const Parsed = new Parser(MiddlewaresContainer).parse();

          // Import Middleware
          Parsed.pop("ImportsContainer", options.name + "Import");

          // Add Middleware to Container
          Parsed.pop("MiddlewaresContainer", options.name + "Middleware");

          // Update Middlewares Container
          Fs.writeFileSync(
            Path.join(Project.MiddlewaresPath, `./index.ts`),
            Parsed.render()
          );
        },
      },
      {
        title: "Configuring your project",
        task: () => {
          // Get Configuration
          const Configuration = Core.getConfiguration()!;

          // Remove Middleware Transaction
          Configuration.transactions = Configuration.transactions.filter(
            (transaction) =>
              !(
                transaction.command === "create-middleware" &&
                transaction.params.name === options.name
              )
          );

          // Update History
          Configuration.history.middleware = options.name;

          // Set Transactions
          Core.setConfiguration(Configuration);
        },
      },
    ]).run();
  };
}
