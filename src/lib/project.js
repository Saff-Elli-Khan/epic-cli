"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const execa_1 = __importDefault(require("execa"));
class Project {
}
exports.Project = Project;
Project.create = (options) => {
    var _a;
    (_a = execa_1.default("git", [
        "clone",
        "https://github.com/Saff-Elli-Khan/epic-application",
    ]).stdout) === null || _a === void 0 ? void 0 : _a.pipe(process.stdout);
    return true;
};
