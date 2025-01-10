import fs from "fs";

export function readJsonFile(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

export function writeJsonFile(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}
