"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpicCli = void 0;
const epic_cli_builder_1 = require("@saffellikhan/epic-cli-builder");
const core_1 = require("./commands/core");
const project_1 = require("./commands/project");
// Get Package Information
const Package = require("../package.json");
// Create New Cli
exports.EpicCli = new epic_cli_builder_1.CreateCli("Epic", Package.version, [
    ...core_1.CoreCommands,
    ...project_1.ProjectCommands,
]);
