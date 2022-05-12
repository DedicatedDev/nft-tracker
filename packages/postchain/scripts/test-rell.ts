import { spawn } from "child_process";
import path from "path";
import { BinariesManager } from "./binaryManager";

export const test = async () => {
  const binaryManager = new BinariesManager()
  await binaryManager.downloadBinariesIfNeeded();
  const outputDir = binaryManager.getOutputDir();
  console.log("🚀 Starting test ...");
  const commandPath = path.join(outputDir, "postchain-node", "multirun.sh");
  const sourceDir = path.join(__dirname, "..", "rell", "src");
  const configPath = path.join(__dirname, "..", "rell", "config", "run.xml");

  const child = spawn(commandPath, ["-d", sourceDir, "--test", configPath]);
  child.stdout.on("data", function (data) {
    let output = data.toString();
    if (output.match(/.*POSTCHAIN APP STARTED.*/)) {
      console.log("Postchain node ready!");
      child.emit("ready");
    }
    console.log(output.substring(0, output.length - 1));
  });

  child.stderr.on("data", function (data) {
    let output = data.toString();
    console.log(output.substring(0, output.length - 1));
  });

  child.stdin.on("data", function (data) {
    console.log("stdin:" + data);
  });

  return child;
};

(async () => {
  await test();
})();
