import fs from "fs";
export const Utils = {
  handlingError: (error: any) => {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      process.stdout.write("\rUnexpected Error");
    }
  },

  handlingBatchError: (errs: Error[]) => {
    errs.map((err) => {
      console.log("====================================");
      console.log(err.message);
      console.log("====================================");
    });
  },
};
