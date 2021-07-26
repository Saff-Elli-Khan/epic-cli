#! /usr/bin/env node

import { CreateCli } from "@saffellikhan/epic-cli-builder";
import { ProjectCommands } from "./commands/project";

// Get Package Information
const Package = require("../package.json");

// Create New Cli
const EpicCli = new CreateCli("Epic", Package.version, [...ProjectCommands]);

// Initialize Cli
EpicCli.init(process.argv);
