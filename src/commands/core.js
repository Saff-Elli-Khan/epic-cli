"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreCommands = void 0;
const core_1 = require("../lib/core");
exports.CoreCommands = [
    {
        name: "install",
        description: "Install configuration commands.",
        method: core_1.Core.install,
    },
];
