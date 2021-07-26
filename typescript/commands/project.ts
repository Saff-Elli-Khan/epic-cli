import { LooseCommandsInterface } from "epic-cli-builder";
import { Project } from "../lib/project";
import { EpicGeo } from "epic-geo";
import Path from "path";

export const ProjectCommands: LooseCommandsInterface[] = [
  {
    name: "create-project",
    alias: ["--init"],
    params: [
      {
        type: "input",
        name: "name",
        alias: ["--name", "-n"],
        message: "Please provide a project name:",
        default: Path.basename(Path.resolve()),
      },
      {
        type: "input",
        name: "description",
        alias: ["--description", "-d"],
        message: "Please provide a project description:",
      },
      {
        type: "input",
        name: "brandName",
        alias: ["--brand-name", "-bn"],
        message: "Please provide a brand name:",
      },
      {
        type: "list",
        name: "brandCountry",
        alias: ["--brand-country", "-bc"],
        message: "Please provide your country:",
        choices: new EpicGeo().countryList(),
      },
      {
        type: "input",
        name: "brandAddress",
        alias: ["--brand-address", "-ba"],
        message: "Please provide your address:",
        default: "N/A",
      },
    ],
    method: Project.create,
  },
];
