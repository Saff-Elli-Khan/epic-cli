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
      const ControllersPath =
        ConfigManager.getConfig("main").paths!.contollers!;

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
        choices: ["application", "plugin"],
        default: "application",
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
    params: [
      {
        type: "confirm",
        name: "admin",
        description: "Add an Admin Dashboard to the project.",
        alias: ["--admin"],
        default: false,
      },
      {
        type: "confirm",
        name: "installation",
        description: "Install dependencies automatically.",
        alias: ["-i"],
        message: "Do you want to install dependencies automatically?",
      },
      {
        type: "confirm",
        name: "yarn",
        description: "Install dependencies with Yarn.",
        alias: ["--yarn"],
        default: false,
      },
    ],
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
    name: "create-model",
    description: "Create a database model.",
    params: [
      {
        type: "input",
        name: "name",
        description: "Name of the model.",
        alias: ["--name", "-n"],
        message: "Please provide a model name:",
        validator: (value) => {
          if (!/^[A-Z]\w+$/.test(value))
            throw new Error(`Please provide a valid model name!`);
        },
      },
      {
        type: "input",
        name: "description",
        description: "Description for the model.",
        alias: ["--description", "-d"],
        message: "Please provide a model description:",
        default: "N/A",
      },
      {
        type: "input",
        name: "templateDir",
        description: "Model templates container directory.",
        alias: ["--templateDir", "-td"],
        skip: true,
      },
      {
        type: "list",
        name: "template",
        description: "Template of the Model",
        message: "Please provide a model template:",
        choices: (options) => {
          // Model Path
          const ModelDir =
            options.templateDir ||
            Path.join(
              ConfigManager.getConfig("main").paths!.templates!,
              "./model/"
            );

          // Resolve Directory
          Fs.mkdirSync(ModelDir, { recursive: true });

          // Templates List
          return Fs.readdirSync(ModelDir)
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
    method: Project.createModel,
  },
  {
    name: "delete-model",
    description: "Remove model from project.",
    params: [
      {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the model.",
        message: "Please provide a model name:",
        choices: () => {
          const ModelsPath = ConfigManager.getConfig("main").paths!.models!;

          // Resolve Directory
          Fs.mkdirSync(ModelsPath, { recursive: true });

          // Models List
          return Fs.readdirSync(ModelsPath)
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
    method: Project.deleteModel,
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
          const MiddlewaresPath =
            ConfigManager.getConfig("main").paths!.middlewares!;

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
    name: "link-plugins",
    description: "Manually link all Epic plugins to the project.",
    before: () => {
      // Check Configuration File
      if (!ConfigManager.hasConfig("main"))
        throw new Error("Please initialize a project first!");
    },
    method: Project.linkPlugins,
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
  {
    name: "create-job",
    description: "Create a new cron job.",
    params: [
      {
        type: "input",
        name: "name",
        description: "Name of the cron job.",
        alias: ["--name", "-n"],
        message: "Please provide a job name:",
        validator: (value) => {
          if (!/^[A-Z]\w+$/.test(value))
            throw new Error(`Please provide a valid cron job name!`);
        },
      },
      {
        type: "input",
        name: "description",
        description: "Description for the cron job.",
        alias: ["--description", "-d"],
        message: "Please provide the job description:",
        default: "N/A",
      },
      {
        type: "input",
        name: "templateDir",
        description: "Cron job templates container directory.",
        alias: ["--templateDir", "-td"],
        skip: true,
      },
      {
        type: "list",
        name: "template",
        description: "Template of the Cron job",
        message: "Please provide a cron job template:",
        choices: (options) => {
          // Cron Job Path
          const JobDir =
            options.templateDir ||
            Path.join(
              ConfigManager.getConfig("main").paths!.templates!,
              "./job/"
            );

          // Resolve Directory
          Fs.mkdirSync(JobDir, { recursive: true });

          // Templates List
          return Fs.readdirSync(JobDir)
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
    method: Project.createJob,
  },
  {
    name: "delete-job",
    description: "Remove job from project.",
    params: [
      {
        type: "list",
        name: "name",
        alias: ["--name", "-n"],
        description: "Name of the job.",
        message: "Please provide a job name:",
        choices: () => {
          const JobsPath = ConfigManager.getConfig("main").paths!.jobs!;

          // Resolve Directory
          Fs.mkdirSync(JobsPath, { recursive: true });

          // Jobs List
          return Fs.readdirSync(JobsPath)
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
    method: Project.deleteJob,
  },
];
