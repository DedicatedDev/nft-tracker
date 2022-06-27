import { RetryOptions } from "ts-retry";

export const RETRY_OPTION: RetryOptions = {
  maxTry: 3,
  delay: 1000,
};
