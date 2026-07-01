import type { TLoader } from "@operoz/types";

// checks if a loader has finished initialization
export const isLoaderReady = (loader: TLoader | undefined) => loader !== "init-loader";
