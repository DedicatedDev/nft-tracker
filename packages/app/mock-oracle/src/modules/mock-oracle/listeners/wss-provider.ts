import { ethers } from "ethers";

export class WSSProvider extends ethers.providers.WebSocketProvider {
  private expectedPongBack;
  private keepAliveCheckInterval;
  constructor(wssUrl: string, expectedPongBack: number = 15000, keepAliveCheckInterval: number = 75000) {
    super(wssUrl);
    this.expectedPongBack = expectedPongBack;
    this.keepAliveCheckInterval = keepAliveCheckInterval;
  }
  safeConnect() {
    let pingTimeout: NodeJS.Timeout;
    let keepAliveInterval: NodeJS.Timeout;
    this._websocket.on("open", () => {
      keepAliveInterval = setInterval(() => {
        console.debug("Checking if the connection is alive, sending a ping");
        this._websocket.ping();
        pingTimeout = setTimeout(() => {
          this._websocket.terminate();
        }, this.expectedPongBack);
      }, this.keepAliveCheckInterval);
    });

    this._websocket.on("close", () => {
      console.error("The websocket connection was closed");
      clearInterval(keepAliveInterval);
      clearTimeout(pingTimeout);
      this.safeConnect();
    });

    this._websocket.on("pong", () => {
      console.debug("Received pong, so connection is alive, clearing the timeout");
      clearInterval(pingTimeout);
    });
  }
}
