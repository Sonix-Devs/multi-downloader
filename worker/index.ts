import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

export class MultiDownloaderContainer extends Container<Env> {
  defaultPort = 3000;
  sleepAfter = "10m";

  envVars = {
    DATABASE_URL: env.DATABASE_URL,
    MULTI_DOWNLOADER_ROOT: "/data/downloads",
    NODE_ENV: "production",
  };

  override onStart() {
    console.log("Multi Downloader container instance started");
  }

  override onStop() {
    console.log("Multi Downloader container instance stopped");
  }

  override onError(error: unknown) {
    console.error("Multi Downloader container error:", error);
  }
}

export default {
  async fetch(request: Request, workerEnv: Env): Promise<Response> {
    const container = getContainer(workerEnv.MULTI_DOWNLOADER_CONTAINER, "primary");
    return container.fetch(request);
  },
};
