import { LooseCommandInterface } from "@saffellikhan/epic-cli-builder";
import { Project } from "../lib/project";
import { Core } from "../lib/core";
import { EpicGeo } from "epic-geo";
import Path from "path";
import Fs from "fs";

export const ProjectCommands: LooseCommandInterface[] = [
  {
    name: "init",
    description: "Initialize Or Configure an Epic project.",
    alias: ["--init", "--configure"],
    params: [
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
          Core.getConfiguration()?.application?.name ||
          Path.basename(Path.resolve()),
      },
      {
        type: "input",
        name: "description",
        description: "Description for the project.",
        alias: ["--description", "-d"],
        message: "Please provide a project description:",
        default: () =>
          Core.getConfiguration()?.application?.description || "N/A",
      },
      {
        type: "input",
        name: "brandName",
        description: "Name of the Brand for the project.",
        alias: ["--brand-name", "-bn"],
        message: "Please provide a brand name:",
        default: () =>
          Core.getConfiguration()?.application?.brand?.name || "N/A",
      },
      {
        type: "list",
        name: "brandCountry",
        description: "Country of the project Brand.",
        alias: ["--brand-country", "-bc"],
        message: "Please provide your country:",
        choices: new EpicGeo().countryList(),
        default: () =>
          Core.getConfiguration()?.application?.brand?.country || "N/A",
      },
      {
        type: "input",
        name: "brandAddress",
        description: "Address of the project Brand.",
        alias: ["--brand-address", "-ba"],
        message: "Please provide your address:",
        default: () =>
          Core.getConfiguration()?.application?.brand?.address || "N/A",
      },
    ],
    default: {
      name: Path.basename(Path.resolve()),
      description: "N/A",
      brandName: "N/A",
      brandCountry: "N/A",
      brandAddress: "N/A",
    },
    method: Core.initialize,
  },
  {
    name: "create-project",
    description: "Create a new Epic project quickly.",
    method: Project.create,
  },
  {
    name: "create-controller",
    description: "Create a new controller in your Epic project.",
    params: [
      {
        type: "input",
        name: "name",
        description: "Name of the controller.",
        alias: ["--name", "-n"],
        message: "Please provide a controller name:",
        validator: (value) => {
          if (!/^[A-Z]\w+$/.test(value))
            throw new Error(`Please provide a valid controller name!`);
        },
      },
      {
        type: "input",
        name: "description",
        description: "Description for the controller.",
        alias: ["--description", "-d"],
        message: "Please provide a controller description:",
        default: () => "N/A",
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
        name: "sampleDir",
        description: "Controller samples container directory.",
        alias: ["--sampleDir", "-sd"],
        optional: true,
      },
      {
        type: "list",
        name: "template",
        description: "Template of the Controller",
        message: "Please provide a controller template:",
        choices: (options) => {
          // Controller Path
          const ControllerDir =
            options.sampleDir ||
            Path.join(Project.SamplesPath, "./controller/");

          // Resolve Directory
          Fs.mkdirSync(ControllerDir, { recursive: true });

          // Samples List
          const List = Fs.readdirSync(ControllerDir)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return [...(List.length ? List : ["default"])];
        },
      },
      {
        type: "list",
        name: "parent",
        description: "Controller parent name.",
        message: "Please provide the name of parent controller:",
        choices: () => {
          // Resolve Directory
          Fs.mkdirSync(Project.ControllersPath, { recursive: true });

          // Controllers List
          const List = Fs.readdirSync(Project.ControllersPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return [...(List.length ? List : ["index"])];
        },
      },
    ],
    method: Project.createController,
  },
  {
    name: "delete-controller",
    description: "Remove controller from project.",
    params: [
      {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the controller.",
        message: "Please provide a controller name:",
        choices: () => {
          // Resolve Directory
          Fs.mkdirSync(Project.ControllersPath, { recursive: true });

          // Controllers List
          const List = Fs.readdirSync(Project.ControllersPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return [...(List.length ? List : ["index"])];
        },
      },
    ],
    method: Project.deleteController,
  },
  {
    name: "create-schema",
    description: "Create a database schema",
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
        default: () => "N/A",
      },
      {
        type: "input",
        name: "sampleDir",
        description: "Schema samples container directory.",
        alias: ["--sampleDir", "-sd"],
        optional: true,
      },
      {
        type: "list",
        name: "template",
        description: "Template of the Schema",
        message: "Please provide a schema template:",
        choices: (options) => {
          // Schema Path
          const SchemaDir =
            options.sampleDir || Path.join(Project.SamplesPath, "./schema/");

          // Resolve Directory
          Fs.mkdirSync(SchemaDir, { recursive: true });

          // Samples List
          const List = Fs.readdirSync(SchemaDir)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return [...(List.length ? List : ["default"])];
        },
      },
    ],
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
          // Resolve Directory
          Fs.mkdirSync(Project.SchemasPath, { recursive: true });

          // Schemas List
          const List = Fs.readdirSync(Project.SchemasPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return List.filter((v) => v !== "index");
        },
      },
    ],
    method: Project.deleteSchema,
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
          // Resolve Directory
          Fs.mkdirSync(Project.SchemasPath, { recursive: true });

          // Schemas List
          const List = Fs.readdirSync(Project.SchemasPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return List.filter((v) => v !== "index");
        },
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
        ],
        default: () => "String",
      },
      {
        type: "array",
        name: "choices",
        description: "Column choices list.",
        message: "Please provide comma separated choices list:",
        optional: (options) => options.type !== "Enum",
      },
      {
        type: "list",
        name: "arrayof",
        description: "Column is an array of type.",
        message: "Array of type:",
        choices: ["String", "Number", "Boolean", "Record", "Relation"],
        default: () => "String",
        optional: (options) => options.type !== "Array",
      },
      {
        type: "number",
        name: "length",
        alias: ["--length", "-l"],
        description: "Length of the column.",
        message: "Please provide a column length:",
        default: (options) => (options.type === "String" ? 50 : 15),
        optional: (options) => !["String", "Number"].includes(options.type),
      },
      {
        type: "list",
        name: "relation",
        alias: ["--relation", "-r"],
        description: "Name of the Relation schema.",
        message: "Please provide a relation schema:",
        choices: () => {
          // Resolve Directory
          Fs.mkdirSync(Project.SchemasPath, { recursive: true });

          // Schemas List
          const List = Fs.readdirSync(Project.SchemasPath)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return List.filter((v) => v !== "index");
        },
        optional: (options) =>
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
            else if (value.length < 2)
              throw new Error(`Please provide at least two columns!`);
          } else
            throw new Error(`Please provide a valid list of column names!`);
        },
        optional: (options) => !options.relation,
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
        optional: (options) => options.relation,
      },
      {
        type: "input",
        name: "defaultValue",
        alias: ["--default"],
        description: "Default column value.",
        message: "Please provide a default value (code):",
        optional: (options) => options.relation,
      },
      {
        type: "confirm",
        name: "advancedProperties",
        description: "Should add advanced properties to the column or not.",
        message: "Do you want to add advanced properties?",
        optional: (options) => options.relation,
      },
      {
        type: "input",
        name: "collation",
        alias: ["--collation", "-c"],
        description: "Collation of the column.",
        message: "Please provide a column collation:",
        default: () => "utf8mb4_unicode_ci",
        optional: (options) => !options.advancedProperties,
      },
      {
        type: "checkbox",
        name: "index",
        alias: ["--index", "-i"],
        description: "Index on the column.",
        message: "Please provide a column index:",
        choices: ["FULLTEXT", "UNIQUE", "INDEX", "SPATIAL"],
        optional: (options) => !options.advancedProperties,
      },
      {
        type: "input",
        name: "onUpdate",
        alias: ["--on-update"],
        description: "Value on update.",
        message: "Please provide a value on update (code):",
        optional: (options) => !options.advancedProperties,
      },
    ],
    method: Project.createSchemaColumn,
  },
];
