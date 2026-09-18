import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
    // Backend: Node + CommonJS (GitManager, stubs, runner, Electron main/preload)
    {
        files: [
            "main.js",
            "preload.js",
            "main/**/*.js",
            "preload/**/*.js",
            "backend/**/*.js",
            "git/**/*.js",
            "UI/git_sidebar/**.js",
            "UI/codebase_indexer/cb_index.js",
            "patchgen.js"
        ],
        extends: [js.configs.recommended],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.commonjs,
                ...globals.es2021,

                // Electron globals
                BrowserWindow: "readonly",
                ipcMain: "readonly",
                ipcRenderer: "readonly",
                contextBridge: "readonly"
            }
        }
    },

    {
        files: ["UI/codebase_indexer/editor_integration.js"],
        extends: [js.configs.recommended],
        languageOptions: {
            sourceType: "commonjs",
            globals: { ...globals.node, ...globals.browser }
        }
    },

    {
        files: ["UI/tab_manager/**/*.js"],
        extends: [js.configs.recommended],
        languageOptions: {
            sourceType: "module",
            globals: { ...globals.browser }
        }
    },

    // Renderer: Browser + AMD (Monaco)
    {
        files: ["renderer/**/*.js"],
        extends: [js.configs.recommended],
        languageOptions: {
            sourceType: "script", // browser JS
            globals: {
                ...globals.browser,

                // Monaco AMD loader
                require: "readonly",
                define: "readonly",

                monaco: "readonly"
            }
        }
    }
]);
