import {
  LooseCommandInterface,
  ParamInterface,
} from "@saffellikhan/epic-cli-builder";
import { StrictLevel } from "@saffellikhan/epic-config-manager";
import { Project } from "../lib/project";
import { ConfigManager } from "../lib/core";
import { EpicGeo } from "epic-geo";
import Path from "path";
import Fs from "fs";

// Create Controller Parameters
const CreateControllerParams: ParamInterface[] = [
  {
    type: "input",
    name: "name",
    description: "Name of the controller.",
    alias: ["--name", "-n"],
    message: "Please provide a controller name:",
    validator: (value) => {
      if (value === "None")
        throw new Error(`Controller name 'None' is not allowed!`);
      else if (!/^[A-Z]\w+$/.test(value))
        throw new Error(`Please provide a valid controller name!`);
    },
  },
  {
    type: "input",
    name: "description",
    description: "Description for the controller.",
    alias: ["--description", "-d"],
    message: "Please provide a controller description:",
    default: "N/A",
  },
  {
    type: "input",
    name: "prefix",
    description: "Prefix of the controller.",
    alias: ["--prefix", "-p"],
    message: "Please provide a controller prefix:",
    default: (options) => `/${(options.name as string).toLowerCase()}/`,
  },
  {
    type: "input",
    name: "templateDir",
    description: "Controller templates container directory.",
    alias: ["--templateDir", "-td"],
    skip: true,
  },
  {
    type: "list",
    name: "template",
    description: "Template of the Controller",
    message: "Please select a controller template:",
    choices: (options) => {
      // Controller Path
      const ControllerDir =
        options.templateDir ||
        Path.join(
          ConfigManager.getConfig("main").paths!.templates!,
          "./controller/"
        );

      // Resolve Directory
      Fs.mkdirSync(ControllerDir, { recursive: true });

      // Templates List
      return Fs.readdirSync(ControllerDir)
        .filter((file) => /\.ts$/g.test(file))
        .map((file) => file.replace(/\.\w*/g, ""));
    },
  },
  {
    type: "list",
    name: "parent",
    description: "Controller parent name.",
    message: "Please provide the name of parent controller:",
    choices: () => {
      // Resolve Directory
      Fs.mkdirSync(ConfigManager.getConfig("main").paths!.contollers!, {
        recursive: true,
      });

      // Controllers List
      return [
        "None",
        ...Fs.readdirSync(ConfigManager.getConfig("main").paths!.contollers!)
          .filter((file) => /\.ts$/g.test(file))
          .map((file) => file.replace(/\.\w*/g, "")),
      ];
    },
  },
];

// Delete Controller Params
const DeleteControllerParams: ParamInterface[] = [
  {
    type: "list",
    name: "name",
    alias: ["--name", "-n"],
    description: "Name of the controller.",
    message: "Please provide a controller name:",
    choices: () => {
      const ControllersPath = ConfigManager.getConfig("main").paths!
        .contollers!;

      // Resolve Directory
      Fs.mkdirSync(ControllersPath, {
        recursive: true,
      });

      // Controllers List
      return Fs.readdirSync(ControllersPath)
        .filter((file) => /\.ts$/g.test(file))
        .map((file) => file.replace(/\.\w*/g, ""));
    },
  },
];

// Create Project CLI Commands List
export const ProjectCommands: LooseCommandInterface[] = [
  {
    name: "init",
    description: "Initialize Or Configure an Epic project.",
    alias: ["--init", "--configure"],
    params: [
      {
        type: "list",
        name: "type",
        description: "Type of the project.",
        alias: ["--type", "-t"],
        message: "Please provide a project type:",
        choices: ["Application", "Plugin"],
        default: "Application",
      },
      {
        type: "input",
        name: "name",
        description: "Name of the project.",
        alias: ["--name", "-n"],
        message: "Please provide a project name:",
        validator: (value) => {
          if (
            !/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
              value
            )
          )
            throw new Error("Please provide a valid lowercase project name!");
        },
        default: () =>
          ConfigManager.getConfig("main", StrictLevel.NORMAL)?.name ||
          Path.basename(Path.resolve()),
      },
      {
        type: "input",
        name: "description",
        description: "Description for the project.",
        alias: ["--description", "-d"],
        message: "Please provide a project description:",
        default: () => ConfigManager.getConfig("main")?.description || "N/A",
      },
      {
        type: "input",
        name: "brandName",
        description: "Name of the Brand for the project.",
        alias: ["--brand-name", "-bn"],
        message: "Please provide a brand name:",
        default: () => ConfigManager.getConfig("main")?.brand?.name || "N/A",
      },
      {
        type: "list",
        name: "brandCountry",
        description: "Country of the project Brand.",
        alias: ["--brand-country", "-bc"],
        message: "Please provide your country:",
        choices: new EpicGeo().countryList(),
        default: () => ConfigManager.getConfig("main")?.brand?.country || "N/A",
      },
      {
        type: "input",
        name: "brandAddress",
        description: "Address of the project Brand.",
        alias: ["--brand-address", "-ba"],
        message: "Please provide your address:",
        default: () => ConfigManager.getConfig("main")?.brand?.address || "N/A",
      },
    ],
    default: {
      type: "Application",
      name: Path.basename(Path.resolve()),
      description: "N/A",
      brandName: "N/A",
      brandCountry: "N/A",
      brandAddress: "N/A",
    },
    method: Project.initialize,
  },
  {
    name: "create",
    description: "Create a new Epic project.",
    method: Project.create,
  },
  {
    name: "create-controller",
    description: "Create a new controller in your Epic project.",
    params: CreateControllerParams,
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.createController,
  },
  {
    name: "delete-controller",
    description: "Remove controller from project.",
    params: DeleteControllerParams,
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.deleteController,
  },
  {
    name: "create-schema",
    description: "Create a database schema.",
    params: [
      {
        type: "input",
        name: "name",
        description: "Name of the schema.",
        alias: ["--name", "-n"],
        message: "Please provide a schema name:",
        validator: (value) => {
          if (!/^[A-Z]\w+$/.test(value))
            throw new Error(`Please provide a valid schema name!`);
        },
      },
      {
        type: "input",
        name: "description",
        description: "Description for the schema.",
        alias: ["--description", "-d"],
        message: "Please provide a schema description:",
        default: "N/A",
      },
      {
        type: "input",
        name: "templateDir",
        description: "Schema templates container directory.",
        alias: ["--templateDir", "-td"],
        skip: true,
      },
      {
        type: "list",
        name: "template",
        description: "Template of the Schema",
        message: "Please provide a schema template:",
        choices: (options) => {
          // Schema Path
          const SchemaDir =
            options.templateDir ||
            Path.join(
              ConfigManager.getConfig("main").paths!.templates!,
              "./schema/"
            );

          // Resolve Directory
          Fs.mkdirSync(SchemaDir, { recursive: true });

          // Templates List
          return Fs.readdirSync(SchemaDir)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));
        },
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.createSchema,
  },
  {
    name: "delete-schema",
    description: "Remove schema from project.",
    params: [
      {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the schema.",
        message: "Please provide a schema name:",
        choices: () => {
          const SchemasPath = ConfigManager.getConfig("main").paths!.schemas!;

          // Resolve Directory
          Fs.mkdirSync(SchemasPath, { recursive: true });

          // Schemas List
          return Fs.readdirSync(SchemasPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));
        },
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.deleteSchema,
  },
  {
    name: "create-module",
    description: "Create a new module.",
    params: CreateControllerParams,
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.createModule,
  },
  {
    name: "delete-module",
    description: "Delete module from project.",
    params: DeleteControllerParams,
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.deleteModule,
  },
  {
    name: "create-schema-column",
    description: "Create new schema column.",
    params: [
      {
        type: "list",
        name: "schema",
        alias: ["--schema", "-s"],
        description: "Name of the schema.",
        message: "Please provide a schema:",
        choices: () => {
          const SchemasPath = ConfigManager.getConfig("main").paths!.schemas!;

          // Resolve Directory
          Fs.mkdirSync(SchemasPath, { recursive: true });

          // Schemas List
          return Fs.readdirSync(SchemasPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));
        },
        default: () =>
          ConfigManager.getConfig("transactions")?.lastAccess?.schema,
      },
      {
        type: "list",
        name: "type",
        alias: ["--type", "-t"],
        description: "Type of the column.",
        message: "Please provide a column type:",
        choices: [
          "String",
          "Number",
          "Boolean",
          "Enum",
          "Record",
          "Array",
          "Relation",
          "Any",
        ],
        default: "String",
      },
      {
        type: "array",
        name: "choices",
        description: "Column choices list.",
        message: "Please provide comma separated choices list:",
        skip: (options) => options.type !== "Enum",
      },
      {
        type: "list",
        name: "arrayof",
        description: "Column is an array of type.",
        message: "Array of type:",
        choices: ["String", "Number", "Boolean", "Record", "Relation", "Any"],
        default: "String",
        skip: (options) => options.type !== "Array",
      },
      {
        type: "input",
        name: "recordType",
        description: "Type of the record.",
        message: "Please provide the type of the record:",
        default: "any",
        skip: (options) =>
          options.type !== "Record" && options.arrayof !== "Record",
      },
      {
        type: "number",
        name: "length",
        alias: ["--length", "-l"],
        description: "Length of the column.",
        message: "Please provide a column length:",
        default: 50,
        skip: (options) => !["String", "Number"].includes(options.type),
      },
      {
        type: "list",
        name: "relation",
        alias: ["--relation", "-r"],
        description: "Name of the Relation schema.",
        message: "Please provide a relation schema:",
        choices: () => {
          const SchemasPath = ConfigManager.getConfig("main").paths!.schemas!;

          // Resolve Directory
          Fs.mkdirSync(SchemasPath, { recursive: true });

          // Schemas List
          return Fs.readdirSync(SchemasPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));
        },
        skip: (options) =>
          options.type !== "Relation" && options.arrayof !== "Relation",
      },
      {
        type: "array",
        name: "mapping",
        description: "Column relation mapping.",
        message:
          "Please provide two column relation mapping separated by comma:",
        validator: (value) => {
          if (value instanceof Array) {
            if (value.length > 2)
              throw new Error(`Please provide just two columns!`);
            else if (value.length < 1)
              throw new Error(`Please provide at least one column!`);
            else if (value.length < 2) return [value[0], value[0]];
          } else
            throw new Error(`Please provide a valid list of column names!`);
        },
        default: (options) => options.relation + "Id",
        skip: (options) => !options.relation,
      },
      {
        type: "input",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the column.",
        message: "Please provide a column name:",
        validator: (value) => {
          if (!/^[A-Z]\w+$/.test(value))
            throw new Error(`Please provide a valid column name!`);
        },
        default: (options) =>
          options.relation
            ? options.type === "Array"
              ? options.relation + "s"
              : options.relation
            : undefined,
      },
      {
        type: "confirm",
        name: "nullable",
        alias: ["--nullable"],
        description: "Is the column nullable or not.",
        message: "Is this column nullable?",
        skip: (options) => options.relation,
      },
      {
        type: "input",
        name: "defaultValue",
        alias: ["--default"],
        description: "Default column value.",
        message: "Please provide a default value (code):",
        skip: (options) => options.relation,
      },
      {
        type: "confirm",
        name: "advancedProperties",
        description: "Should add advanced properties to the column or not.",
        message: "Do you want to add advanced properties?",
        skip: (options) => options.relation,
      },
      {
        type: "input",
        name: "collation",
        alias: ["--collation", "-c"],
        description: "Collation of the column.",
        message: "Please provide a column collation:",
        default: "utf8mb4_unicode_ci",
        skip: (options) => !options.advancedProperties,
      },
      {
        type: "checkbox",
        name: "index",
        alias: ["--index", "-i"],
        description: "Index on the column.",
        message: "Please provide a column index:",
        choices: ["FULLTEXT", "UNIQUE", "INDEX", "SPATIAL"],
        skip: (options) => !options.advancedProperties,
      },
      {
        type: "input",
        name: "onUpdate",
        alias: ["--on-update"],
        description: "Value on update.",
        message: "Please provide a value on update (code):",
        skip: (options) => !options.advancedProperties,
      },
    ],
    default: {
      type: "String",
      length: 50,
      nullable: false,
      defaultValue: "",
      advancedProperties: false,
    },
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.createSchemaColumn,
  },
  {
    name: "delete-schema-column",
    description: "Delete a schema column.",
    params: [
      {
        type: "input",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the column.",
        message: "Please provide a column name:",
        validator: (value) => {
          if (!/^[A-Z]\w+$/.test(value))
            throw new Error(`Please provide a valid column name!`);
        },
      },
      {
        type: "list",
        name: "schema",
        alias: ["--schema", "-s"],
        description: "Name of the schema.",
        message: "Please provide a schema:",
        choices: () => {
          const SchemasPath = ConfigManager.getConfig("main").paths!.schemas!;

          // Resolve Directory
          Fs.mkdirSync(SchemasPath, { recursive: true });

          // Schemas List
          return Fs.readdirSync(SchemasPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));
        },
        default: () =>
          ConfigManager.getConfig("transactions")?.lastAccess?.schema,
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.deleteSchemaColumn,
  },
  {
    name: "create-middleware",
    description: "Create a new middleware.",
    params: [
      {
        type: "input",
        name: "name",
        description: "Name of the middleware.",
        alias: ["--name", "-n"],
        message: "Please provide a middleware name:",
        validator: (value) => {
          if (!/^[A-Z]\w+$/.test(value))
            throw new Error(`Please provide a valid middleware name!`);
        },
      },
      {
        type: "input",
        name: "description",
        description: "Description for the middleware.",
        alias: ["--description", "-d"],
        message: "Please provide a middleware description:",
        default: "N/A",
      },
      {
        type: "input",
        name: "templateDir",
        description: "Middleware templates container directory.",
        alias: ["--templateDir", "-td"],
        skip: true,
      },
      {
        type: "list",
        name: "template",
        description: "Template of the Middleware",
        message: "Please provide a middleware template:",
        choices: (options) => {
          // Middleware Path
          const MiddlewareDir =
            options.templateDir ||
            Path.join(
              ConfigManager.getConfig("main").paths!.templates!,
              "./middleware/"
            );

          // Resolve Directory
          Fs.mkdirSync(MiddlewareDir, { recursive: true });

          // Templates List
          return Fs.readdirSync(MiddlewareDir)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));
        },
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.createMiddleware,
  },
  {
    name: "delete-middleware",
    description: "Remove middleware from project.",
    params: [
      {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the middleware.",
        message: "Please provide a middleware name:",
        choices: () => {
          const MiddlewaresPath = ConfigManager.getConfig("main").paths!
            .middlewares!;

          // Resolve Directory
          Fs.mkdirSync(MiddlewaresPath, { recursive: true });

          // Middlewares List
          return Fs.readdirSync(MiddlewaresPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));
        },
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.deleteMiddleware,
  },
  {
    name: "add-plugin",
    description: "Add an Epic plugin to the project.",
    params: [
      {
        type: "input",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the plugin.",
        message: "Please provide a plugin name:",
        validator: (value) => {
          if (
            !/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
              value
            )
          )
            throw new Error("Please provide a valid lowercase plugin name!");
        },
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.addPlugin,
  },
  {
    name: "link-plugin",
    description: "Manually link an Epic plugin to the project.",
    params: [
      {
        type: "input",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the plugin.",
        message: "Please provide a plugin name:",
        validator: (value) => {
          if (
            !/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
              value
            )
          )
            throw new Error("Please provide a valid lowercase plugin name!");
        },
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.linkPlugin,
  },
  {
    name: "update-plugin",
    description: "Update an Epic plugin on the project.",
    params: [
      {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the plugin.",
        message: "Please select a plugin:",
        choices: () => Object.keys(ConfigManager.getConfig("main").plugins),
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.updatePlugin,
  },
  {
    name: "remove-plugin",
    description: "Remove an Epic plugin from the project.",
    params: [
      {
        type: "input",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the plugin.",
        message: "Please provide a plugin name to remove:",
        validator: (value) => {
          if (
            !/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
              value
            )
          )
            throw new Error("Please provide a valid lowercase plugin name!");
        },
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.removePlugin,
  },
  {
    name: "unlink-plugin",
    description: "Manually unlink an Epic plugin from the project.",
    params: [
      {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the plugin.",
        message: "Please select a plugin:",
        choices: () => Object.keys(ConfigManager.getConfig("main").plugins),
      },
    ],
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.unlinkPlugin,
  },
];
