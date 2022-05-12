import { appendFileSync, existsSync, mkdirSync, writeFileSync} from "fs";

export const saveDeployedAddress = async (name:string,address:string) => {
  appendFileSync("./.env", `\nAPP_ADDRESS=${address}`);
  const settingInfo = {
    curveAddress: ""
  };

  const settingsPath = "../contracts-typechain/settings";
  if (!existsSync(settingsPath)) {
     mkdirSync(settingsPath,{recursive: true});
  } 
  const json = JSON.stringify(settingInfo);
  writeFileSync(`${settingsPath}/settings.json`, json, "utf-8");
};
