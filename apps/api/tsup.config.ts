import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entryPoints: ["src/index.ts"],
  clean: true,
  format: ["cjs"],
  onSuccess:
    "cp -a node_modules/@pcd/proto-pod-gpc-artifacts/*.{zkey,json} dist && cp -a views public",
  ...options,
}));
