"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomKey = void 0;
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
