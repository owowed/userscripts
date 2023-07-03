import { defineConfig } from "vite";
import monkey, { MonkeyUserScript } from "vite-plugin-monkey";
import Yaml from "yaml";
import fs from "fs";
import { glob } from "glob";
import { PluginOption } from "vite";
import { formatString } from "./shared/format";

const distFolder = "./dist";
const configFolder = "./config";
const srcFolder = "./src";

//

const userscriptFolders = await glob(`${srcFolder}/*`, { posix: true });
const monkeyPlugins: PluginOption[] = [];

const headerTemplate: MonkeyUserScript = Yaml.parse(fs.readFileSync(`${configFolder}/userscript-template.yml`).toString());

for (const userjs of userscriptFolders) {
    const header: MonkeyUserScript = {
        "owowed:current_release":
            process.env.USERSCRIPTS_CURRENT_RELEASE_TAG?.slice(1) ?? "0.1.0",
        ...headerTemplate,
        ...Yaml.parse(fs.readFileSync(`${userjs}/userscript.yml`).toString())
    };

    for (const [key, value] of Object.entries(header) as [string, string][]) {
        if (typeof value != "string") continue;
        header[key] = formatString(value, header);
    }

    monkeyPlugins.push(monkey({
        entry: `${userjs}/main.ts`,
        userscript: header,
        build: {
            fileName: `${header["owowed:filename"]}.user.js`,
            autoGrant: false,
            externalGlobals: {
                "@owowed/oxi": "oxi"
            }
        },
    }));
}

export default defineConfig({
    resolve: {
        alias: {
            "@shared/": "./shared/"
        }
    },
    build: {
        outDir: distFolder,
    },
    plugins: [
        ...monkeyPlugins
    ]
});
