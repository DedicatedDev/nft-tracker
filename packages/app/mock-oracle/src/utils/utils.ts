import fs from "fs";
export const Utils = {
  handlingError: (error: any) => {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      process.stdout.write("\rUnexpected Error");
    }
  },
};
