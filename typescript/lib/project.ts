import Execa from "execa";

export interface CreateOptions {
  name: string;
}

export class Project {
  static create = async (options: CreateOptions) => {
    const { stdout } = await Execa("git", [
      "clone",
      "https://github.com/Saff-Elli-Khan/epic-application",
      ".",
    ]);

    console.log(stdout);

    return true;
  };
}
