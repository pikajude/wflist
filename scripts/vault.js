#!/usr/bin/env node

import { exec } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

/**
 * @param {string} url
 * @param {import("node:fs").PathLike} path
 */
async function downloadTo(url, path) {
  const resp = await fetch(url);
  const body = await resp.text();
  await writeFile(path, body);
}

const tmpDir = await mkdtemp(join(tmpdir(), "wfs-vault-"));

const vaultJson = join(import.meta.dirname, "../src/data/vault.json");

console.log("fetching data from wiki");
await Promise.all([
  downloadTo(
    "https://wiki.warframe.com/w/Module:Void/data?action=raw",
    join(tmpDir, "Void.lua"),
  ),
  downloadTo(
    "https://wiki.warframe.com/w/Module:Table?action=raw",
    join(tmpDir, "Module:Table.lua"),
  ),
  writeFile(
    join(tmpDir, "main.lua"),
    `
local VoidData = require('Void').PrimeData

for itemName, itemData in pairs(VoidData) do
    if itemData["IsVaulted"] then
        local skip = false
        for partName, partData in pairs(itemData["Parts"]) do
            if partData["DucatValue"] == 0 then
                skip = true
            end
        end
        if (not skip) then
            print(itemName)
        end
    end
end
  `,
  ),
]);

const { stdout } = await promisify(exec)(`lua main.lua`, {
  cwd: tmpDir,
});

const lines = stdout.split("\n").filter((l) => l.length > 0);

await writeFile(vaultJson, JSON.stringify(lines));
console.log("done");
