import { exec } from "child_process";
import path from "path";
import http from "http";
import fs from "fs-extra";
import os from "os";
import { PostChainConfig as config} from "@evm/base";

export class BinariesManager {

  private binariesBaseUrl: string = "http://www.chromia.dev/rellr";
  private binariesFilename: string = `rellr-${config.rell.version}-dist.tar.gz`;
  private rellVersion = config.rell.version;

  private dir: string = path.join(os.homedir(), ".rell", "bin");
  private outputDir: string;
  private file: string;

  constructor() {
    this.outputDir = path.join(this.dir, this.rellVersion);
    this.file = path.join(this.dir, this.binariesFilename);
  }

  private execAsync = async (command: string) => {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve([stdout, stderr]);
        }
      });
    });
  };

  private untar = async () => {
    await this.execAsync(`tar xvzf ${this.file} -C ${this.outputDir}`);
  };

  private downloadBinaries = async () => {
    return new Promise<void>(async (resolve, reject) => {
      if ((await fs.pathExists(this.dir)) === false) {
        await fs.ensureDir(this.dir);
      }

      if ((await fs.pathExists(this.outputDir)) === false) {
        await fs.ensureDir(this.outputDir);
      }

      http
        .get(`${this.binariesBaseUrl}/${this.binariesFilename}`, (response) => {
          const code = response.statusCode as number;
          if (code >= 400) {
            reject();
          } else {
            response
              .pipe(fs.createWriteStream(this.file))
              .on("finish", () => resolve())
              .on("error", () => {
                if (fs.existsSync(this.file)) {
                  fs.unlinkSync(this.file);
                }
                reject();
              });
          }
        })
        .on("error", reject);
    });
  };

  downloadBinariesIfNeeded = async () => {
    if (fs.pathExistsSync(this.outputDir)) {
      return;
    }

    console.log("Cannot find Postchain binaries.");
    console.log("Starting binaries download ...");
    await this.downloadBinaries();
    console.log("Extracting the binaries ...");
    await this.untar();
    console.log("Done!");
  };

  getOutputDir = () => {
      return this.outputDir;
  }
}
