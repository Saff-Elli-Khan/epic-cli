import Execa from "execa";

export interface CreateOptions {
  name: string;
}

export class Project {
  static create = (options: CreateOptions) => {
    Execa("git", [
      "clone",
      "https://github.com/Saff-Elli-Khan/epic-application",
    ]).stdout?.pipe(process.stdout);

    return true;
  };
}
