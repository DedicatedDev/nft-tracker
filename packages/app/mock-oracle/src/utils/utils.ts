import fs from "fs";
import { ErrorMsg, RETRY_ERRORS } from "../const/error";

export const Utils = {
  handlingError: (error: any, pos?: string): boolean => {
    if (error instanceof Error) {
      if (!error.message.includes(ErrorMsg.TX_FAILED) && error !== undefined) {
        console.log(pos, ": ", error.message);
      }
    } else {
      process.stdout.write("\rUnexpected Error");
    }
    return false;
  },

  handlingBatchError: (errs: Error[]) => {
    errs.map((err) => {
      console.log("====================================");
      console.log(err.message);
      console.log("====================================");
    });
  },
};
