import { LooseCommandInterface } from "@saffellikhan/epic-cli-builder";
import { Project } from "../lib/project";
import { Core } from "../lib/core";
import { EpicGeo } from "epic-geo";
import Path from "path";
import Fs from "fs";

export const ProjectCommands: LooseCommandInterface[] = [
  {
    name: "init",
    description: "Initialize an Epic project.",
    alias: ["--init"],
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
        default: Path.basename(Path.resolve()),
      },
      {
        type: "input",
        name: "description",
        description: "Description for the project.",
        alias: ["--description", "-d"],
        message: "Please provide a project description:",
      },
      {
        type: "input",
        name: "brandName",
        description: "Name of the Brand for the project.",
        alias: ["--brand-name", "-bn"],
        message: "Please provide a brand name:",
        default: "N/A",
      },
      {
        type: "list",
        name: "brandCountry",
        description: "Country of the project Brand.",
        alias: ["--brand-country", "-bc"],
        message: "Please provide your country:",
        choices: new EpicGeo().countryList(),
      },
      {
        type: "input",
        name: "brandAddress",
        description: "Address of the project Brand.",
        alias: ["--brand-address", "-ba"],
        message: "Please provide your address:",
        default: "N/A",
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
        default: "N/A",
      },
      {
        type: "number",
        name: "version",
        description: "Version of the controller.",
        alias: ["--version", "-v"],
        message: "Please provide a controller version:",
        validator: (value) => {
          if (value < 1) throw new Error("Please provide a valid version!");
        },
        default: 1,
      },
      {
        type: "input",
        name: "prefix",
        description: "Prefix of the controller.",
        alias: ["--prefix", "-p"],
        message: "Please provide a controller prefix:",
        default: "/",
      },
      {
        type: "list",
        name: "scope",
        description: "Scope of the controller.",
        alias: ["--Scope", "-s"],
        message: "Please provide a controller scope:",
        choices: ["Child", "Parent"],
        default: "Child",
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
        alias: ["--template", "-T"],
        message: "Please provide a controller template:",
        choices: (options) => {
          // Controller Path
          const ControllerDir =
            options.sampleDir ||
            Path.join(process.cwd(), "./src/samples/controller/");

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
        alias: ["--parent", "-pr"],
        message: "Please provide the name of parent controller:",
        choices: (options) => {
          // Controller Path
          const ControllerDir = Path.join(
            process.cwd(),
            `./src/controllers/v${options.version}/`
          );

          // Resolve Directory
          Fs.mkdirSync(ControllerDir, { recursive: true });

          // Parents List
          const List = Fs.readdirSync(ControllerDir)
            .filter((file) => /\.ts$/g.test(file))
            .map((file) => file.replace(/\.\w*/g, ""));

          return [...(List.length ? List : ["index"])];
        },
        optional: (options) => options.scope !== "Child",
      },
    ],
    method: Project.createController,
  },
];
