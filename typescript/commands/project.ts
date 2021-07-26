/**
 *
 * Project Management Commands
 * Version 1.0.0
 *
 */

import { LooseCommandsInterface } from "epic-cli-builder";
import { Project } from "../lib/project";
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
    ],
    method: Project.create,
  },
];
