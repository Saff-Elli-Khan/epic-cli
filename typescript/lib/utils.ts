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

export const copyFileSync = (
  source: string,
  target: string,
  options?: {
    subFileToFile?: boolean;
    fileEditor?: (content: string) => string;
  }
) => {
  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (Fs.existsSync(targetFile))
    if (Fs.lstatSync(targetFile).isDirectory())
      targetFile = Path.join(targetFile, Path.basename(source));

  // Get File Content
  const Content = Fs.readFileSync(source).toString();

  // Sub File To Filename
  if (options?.subFileToFile) targetFile = targetFile.replace(/\\/g, "-");

  // Write New File
  Fs.writeFileSync(
    targetFile,
    typeof options?.fileEditor === "function"
      ? options.fileEditor(Content)
      : Content
  );
};

export const copyFolderRecursiveSync = (
  source: string,
  target: string,
  options?: {
    copySubDir?: boolean;
    subFileToFile?: boolean;
    fileEditor?: (content: string) => string;
  }
) => {
  let files = [];

  // Check if folder needs to be created or integrated
  if (!Fs.existsSync(target)) Fs.mkdirSync(target, { recursive: true });

  // Copy Files
  if (Fs.lstatSync(source).isDirectory()) {
    files = Fs.readdirSync(source);
    files.forEach(function (file) {
      const currentSource = Path.join(source, file);
      if (Fs.lstatSync(currentSource).isDirectory()) {
        if (options?.copySubDir)
          copyFolderRecursiveSync(
            currentSource,
            Path.join(target, Path.basename(currentSource)),
            options
          );
      } else copyFileSync(currentSource, target, options);
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
