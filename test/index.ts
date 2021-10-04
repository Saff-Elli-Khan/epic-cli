import { Project } from "../typescript";

console.log(
  Project.initialize({
    name: "test",
    description: "This is a test app.",
    type: "Application",
    brandName: "Epic",
    brandCountry: "Pakistan",
    brandAddress: "N/A",
  })
);
