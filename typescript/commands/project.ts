import { LooseCommandsInterface } from "@saffellikhan/epic-cli-builder";
import { Project } from "../lib/project";
import { EpicGeo } from "epic-geo";
import Path from "path";

export const ProjectCommands: LooseCommandsInterface[] = [
  {
    name: "create-project",
    description: "Create a new Epic project quickly.",
    alias: ["--init"],
    params: [
      {
        type: "input",
        name: "name",
        description: "Name of the project.",
        alias: ["--name", "-n"],
        message: "Please provide a project name:",
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
          if (/^[A-Z]\w+$/.test(value)) return value;
          else throw new Error(`Please provide a valid controller name!`);
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
        default: 1,
      },
      {
        type: "list",
        name: "type",
        description: "Type of the controller.",
        alias: ["--type", "-t"],
        message: "Please provide a controller type:",
        choices: ["Core", "Custom"],
        default: "Custom",
      },
      {
        type: "list",
        name: "scope",
        description: "Scope of the controller.",
        alias: ["--Scope", "-s"],
        message: "Please provide a controller scope:",
        choices: ["Parent", "Child"],
        default: "Parent",
      },
    ],
    method: Project.createController,
  },
];
