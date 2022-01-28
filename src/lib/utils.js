"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFolderRecursiveSync = exports.copyFolderRecursiveSync = exports.copyFileSync = exports.generateRandomKey = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const generateRandomKey = (length) => {
    let random_string = "";
    let char = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < length; i++) {
        random_string =
            random_string + char.charAt(Math.floor(Math.random() * char.length));
    }
    return random_string;
};
exports.generateRandomKey = generateRandomKey;
const copyFileSync = (source, target) => {
    let targetFile = target;
    // If target is a directory, a new file with the same name will be created
    if (fs_1.default.existsSync(target))
        if (fs_1.default.lstatSync(target).isDirectory())
            targetFile = path_1.default.join(target, path_1.default.basename(source));
    fs_1.default.writeFileSync(targetFile, fs_1.default.readFileSync(source));
};
exports.copyFileSync = copyFileSync;
const copyFolderRecursiveSync = (source, target, copySubDir = false) => {
    let files = [];
    // Check if folder needs to be created or integrated
    if (!fs_1.default.existsSync(target))
        fs_1.default.mkdirSync(target, { recursive: true });
    // Copy Files
    if (fs_1.default.lstatSync(source).isDirectory()) {
        files = fs_1.default.readdirSync(source);
        files.forEach(function (file) {
            const currentSource = path_1.default.join(source, file);
            if (fs_1.default.lstatSync(currentSource).isDirectory() && copySubDir)
                exports.copyFolderRecursiveSync(currentSource, path_1.default.join(target, path_1.default.basename(currentSource)));
            else
                exports.copyFileSync(currentSource, target);
        });
    }
};
exports.copyFolderRecursiveSync = copyFolderRecursiveSync;
const removeFolderRecursiveSync = (path) => {
    if (fs_1.default.existsSync(path)) {
        fs_1.default.readdirSync(path).forEach((file) => {
            const currentPath = path + "/" + file;
            if (fs_1.default.lstatSync(currentPath).isDirectory())
                exports.removeFolderRecursiveSync(currentPath);
            else
                fs_1.default.unlinkSync(currentPath);
        });
        fs_1.default.rmdirSync(path);
    }
};
exports.removeFolderRecursiveSync = removeFolderRecursiveSync;
