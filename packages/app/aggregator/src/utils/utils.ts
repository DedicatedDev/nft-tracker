import fs from "fs";
export const Utils = {
  handlingError: (error: any) => {
    if (error instanceof Error) {
      //console.log(error.message)
      //const currentTimstamp = new Date();
      //console.log(currentTimstamp)
      //fs.appendFileSync("../../../aggregator_log.txt", `[${currentTimstamp.toISOString()}]: ${error.message}`);
    } else {
      process.stdout.write("\rUnexpected Error");
    }
  },
};
