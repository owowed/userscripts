import { build } from "vite";
import monkey, { MonkeyUserScript } from "vite-plugin-monkey";
import Yaml from "yaml";
import fs from "fs-extra";
import { glob } from "glob";
import { PluginOption, InlineConfig } from "vite";
import { formatString } from "@owowed/oxi";

const distFolder = "./dist";
const configFolder = "./config";
const srcFolder = "./src";

// setup userscript headers

const userscriptFolders = await glob(`${srcFolder}/*`, { posix: true });
const monkeyPlugins: { header: Record<string, string>, plugin: PluginOption }[] = [];

const headerTemplate: MonkeyUserScript = Yaml.parse(fs.readFileSync(`${configFolder}/userscript-template.yml`).toString());

for (const userjs of userscriptFolders) {
    const header: MonkeyUserScript & Record<string, string> = {
        "owowed:current_release":
            process.env.USERSCRIPTS_CURRENT_RELEASE_TAG?.slice(1) ?? "0.1.0",
        ...headerTemplate,
        ...Yaml.parse(fs.readFileSync(`${userjs}/userscript.yml`).toString())
    };

    for (const [key, value] of Object.entries(header) as [string, string][]) {
        if (typeof value != "string") continue;
        header[key] = formatString(value, header);
    }

    monkeyPlugins.push({
        header,
        plugin: monkey({
            entry: `${userjs}/main.ts`,
            userscript: header,
            build: {
                fileName: `${header["owowed:filename"]}.user.js`,
                autoGrant: false,
                externalGlobals: {
                    "@owowed/oxi": "oxi"
                }
            },
        })
    });
}

// vite multi-userscript custom build

const viteConfigTemplate: InlineConfig = {
    resolve: {
        alias: {
            "@shared/": "./shared/"
        },
        extensions: [ ".js", ".ts" ]
    },
    build: {
        outDir: distFolder,
        emptyOutDir: false
    },
    plugins: [ /* plugin */ ]
};

fs.emptyDirSync(distFolder);

const targetUserscriptBuild = process.env.USERSCRITPS_BUILD;

if (targetUserscriptBuild) {
    const { header, plugin } = monkeyPlugins.find(({ header }) => header["owowed:id"] == targetUserscriptBuild)!;
    
    console.log(`==> build userscript: ${header["owowed:id"]}`);
    await build({ ...viteConfigTemplate, plugins: [ plugin ] });
}
else {
    for (const { header, plugin } of monkeyPlugins) {
        console.log(`==> build userscript: ${header["owowed:id"]}`);
        await build({ ...viteConfigTemplate, plugins: [ plugin ] });
    }
}
