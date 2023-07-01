import { defineConfig } from "vite";
import monkey, { MonkeyOption, MonkeyUserScript } from "vite-plugin-monkey";
import Yaml from "yaml";
import fs from "fs";
import { glob } from "glob";
import { PluginOption } from "vite";

const distFolder = "./dist";
const configFolder = "./config";
const srcFolder = "./src";

//

const userscriptFolders = await glob(`${srcFolder}/*`, { posix: true });
const monkeyPlugins: PluginOption[] = [];

const headerTemplate: MonkeyUserScript = Yaml.parse(fs.readFileSync(`${configFolder}/userscript-template.yml`).toString());

for (const userjs of userscriptFolders) {
    const header: MonkeyUserScript = {
        ...headerTemplate,
        ...Yaml.parse(fs.readFileSync(`${userjs}/userscript.yml`).toString())
    };

    for (const [key, value] of Object.entries(header) as [string, string][]) {
        if (typeof value != "string") continue;
        header[key] = value.replace(/\${{ ([^ ]+) }}/g, (_, varKey) => header[varKey].toString());
    }

    monkeyPlugins.push(monkey({
        entry: `${userjs}/index.ts`,
        userscript: header,
        build: {
            fileName: `${header.name}-v${header.version}.user.js`,
            autoGrant: false,
            externalGlobals: ""
        }
    }));
}

export default defineConfig({
    build: {
        outDir: distFolder
    },
    plugins: [
        ...monkeyPlugins
    ]
});
