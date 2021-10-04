import { CreateCli } from "@saffellikhan/epic-cli-builder";
import { CoreCommands } from "./commands/core";
import { ProjectCommands } from "./commands/project";

// Get Package Information
const Package = require("../package.json");

// Create New Cli
export const EpicCli = new CreateCli("Epic", Package.version, [
  ...CoreCommands,
  ...ProjectCommands,
]);
