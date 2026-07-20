import type { Config } from "@react-router/dev/config";
import { joinUrlPath } from "@operoz/utils";

const basePath = joinUrlPath(process.env.VITE_SPACE_BASE_PATH ?? "", "/") ?? "/";

export default {
  appDirectory: "app",
  basename: basePath,
  ssr: true,
  // Opt into React Router v8 defaults early (silences Future Flag Warnings in v7)
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;
