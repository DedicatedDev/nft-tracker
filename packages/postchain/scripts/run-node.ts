import { spawn } from "child_process";
import { exit } from "process";
import kill from "tree-kill";
import path from "path";
import { BinariesManager } from "./binaryManager";

const startNode = async() => {
  console.log("Starting Postchain node ...");
  const binaryManager = new BinariesManager();
  await binaryManager.downloadBinariesIfNeeded();

  const outputDir = binaryManager.getOutputDir();
  const commandPath = path.join(outputDir, "postchain-node", "multirun.sh");
  const sourceDir = path.join(__dirname, "..", "rell", "src");
  const configPath = path.join(__dirname, "..", "rell", "config", "run.xml");

  const child = spawn(commandPath, ["-d", sourceDir, configPath]);
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
}
function initializeBlockchain() {
  console.log("🚀 Initializing blockchain ...");
  const initScript = spawn("ts-node", [path.join(__dirname, "initialize-chain.ts")]);
  initScript.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  initScript.stderr.on("data", function (data) {
    console.log(data.toString());
  });

  initScript.on("exit", () => {
    console.log("Blockchain initialized");
  });
  return initScript;
}

async function runNode() {
  const node = await startNode();
  node.on("ready", () => {
    console.log("✅ Node is ready....✅");
    const initScript = initializeBlockchain();
    initScript.on("error", () => {
      console.log("Error initializing the blockchain");
      exit();
    });
  });
  process.on("SIGINT", () => {
    kill(node.pid as number);
  });

  process.on("uncaughtException", (e) => {
    console.log("Uncaught Exception...");
    console.log(e.stack);
    kill(node.pid as number);
  });
}
(async () => {
  await runNode();
})();
