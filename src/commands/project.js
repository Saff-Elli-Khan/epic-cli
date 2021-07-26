"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCommands = void 0;
const project_1 = require("../lib/project");
const epic_geo_1 = require("epic-geo");
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
                choices: new epic_geo_1.EpicGeo().countryList(),
            },
            {
                type: "input",
                name: "brandAddress",
                alias: ["--brand-address", "-ba"],
                message: "Please provide your address:",
                default: "N/A",
            },
        ],
        method: project_1.Project.create,
    },
];
