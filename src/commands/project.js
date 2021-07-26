"use strict";
/**
 *
 * Project Management Commands
 * Version 1.0.0
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCommands = void 0;
const project_1 = require("../lib/project");
const path_1 = __importDefault(require("path"));
exports.ProjectCommands = [
    {
        name: "create-project",
        alias: ["--init"],
        params: [
            {
                type: "input",
                name: "name",
                alias: ["--name", "-n"],
                message: "Please provide a project name:",
                default: path_1.default.basename(path_1.default.resolve()),
            },
        ],
        method: project_1.Project.create,
    },
];
