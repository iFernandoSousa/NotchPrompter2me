import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { execSync } from "child_process";
import path from "path";

const config: ForgeConfig = {
    packagerConfig: {
        executableName: "NotchPrompter",
        icon: "./assets/icon",
        asar: false, // Ensure we can inspect the app content easily, though 'true' is better for shipping. False for now while debugging.
    },
    rebuildConfig: {},
    makers: [new MakerZIP({}, ["darwin"])],
    plugins: [
        new VitePlugin({
            build: [
                { entry: "src/main/index.ts", config: "vite.main.config.ts" },
                {
                    entry: "src/preload/index.ts",
                    config: "vite.preload.config.ts",
                },
            ],
            renderer: [
                { name: "main_window", config: "vite.renderer.config.ts" },
            ],
        }),
    ],
    hooks: {
        packageAfterPrune: async (_config, buildPath) => {
            console.log(
                "Installing production dependencies in build path:",
                buildPath,
            );
            execSync("npm install --omit=dev --no-bin-links", {
                cwd: buildPath,
                stdio: "inherit",
            });
            console.log("Rebuilding native dependencies...");
            // Use the root project's electron-rebuild
            const rebuildPath = path.join(
                process.cwd(),
                "node_modules",
                ".bin",
                "electron-rebuild",
            );
            execSync(
                `${rebuildPath} --force --types prod --module-dir "${buildPath}"`,
                {
                    cwd: buildPath,
                    stdio: "inherit",
                },
            );
        },
    },
};

export default config;
