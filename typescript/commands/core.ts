import { LooseCommandInterface } from "@saffellikhan/epic-cli-builder";
import { Core } from "../lib/core";

export const CoreCommands: LooseCommandInterface[] = [
  {
    name: "install",
    description: "Install configuration commands.",
    method: Core.install,
  },
  {
    name: "update",
    description: "Update Epic CLI.",
    method: Core.update,
  },
];
