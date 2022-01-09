import Path from "path";
import Fs from "fs";

export const generateRandomKey = (length: number) => {
  let random_string = "";
  let char = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < length; i++) {
    random_string =
      random_string + char.charAt(Math.floor(Math.random() * char.length));
  }
  return random_string;
};

export const copyFileSync = (source: string, target: string) => {
  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (Fs.existsSync(target))
    if (Fs.lstatSync(target).isDirectory())
      targetFile = Path.join(target, Path.basename(source));

  Fs.writeFileSync(targetFile, Fs.readFileSync(source));
};

export const copyFolderRecursiveSync = (source: string, target: string) => {
  let files = [];

  // Check if folder needs to be created or integrated
  if (!Fs.existsSync(target)) Fs.mkdirSync(target, { recursive: true });

  // Copy Files
  if (Fs.lstatSync(source).isDirectory()) {
    files = Fs.readdirSync(source);
    files.forEach(function (file) {
      const currentSource = Path.join(source, file);
      if (Fs.lstatSync(currentSource).isDirectory())
        copyFolderRecursiveSync(
          currentSource,
          Path.join(target, Path.basename(currentSource))
        );
      else copyFileSync(currentSource, target);
    });
  }
};

export const removeFolderRecursiveSync = (path: string) => {
  if (Fs.existsSync(path)) {
    Fs.readdirSync(path).forEach((file) => {
      const currentPath = path + "/" + file;
      if (Fs.lstatSync(currentPath).isDirectory())
        removeFolderRecursiveSync(currentPath);
      else Fs.unlinkSync(currentPath);
    });

    Fs.rmdirSync(path);
  }
};
