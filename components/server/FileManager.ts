import fs from "fs";
import Debug from "debug";
import path from "path";
import Runsheet, { JSON as RJSON } from "../common/Runsheet";
import { ServerManager } from "./ServerInit";

export type StorageKey = { display: string; id: string };

const KnownRunsheets: Map<StorageKey, string> = new Map<StorageKey, string>();
const KnownTemplates: Map<StorageKey, string> = new Map<StorageKey, string>();
const KnownStagePlots: Map<StorageKey, string> = new Map<StorageKey, string>();

const StorageDir: string = "storage/";
const RunsheetDir: string = `${StorageDir}runsheets`;
const TemplateDir: string = `${StorageDir}templates`;
const StagePlotDir: string = `${StorageDir}stageplots`;

export function InitIO() {
  fs.mkdir(StorageDir, () => {});
  fs.mkdir(RunsheetDir, () => {});
  fs.mkdir(TemplateDir, () => {});
  fs.mkdir(StagePlotDir, () => {});
  DiscoverRunsheets();
  DiscoverTemplates();
  
  setInterval(() => {
    const handler = ServerManager.handler;
    if (handler && handler.dirty()) {
      handler.save();
      handler?.markDirty(false);
    }
  }, 3000);
}

export const DiscoverRunsheets = () => {
  Discover(RunsheetDir,KnownRunsheets);
}

export const DiscoverTemplates = () => {
  Discover(TemplateDir, KnownTemplates);
}

export const DiscoverStagePlots = () => {
  Discover(StagePlotDir, KnownStagePlots);
}

export function LoadRunsheet(
  key: StorageKey,
  cb: (runsheeet: Runsheet) => void
) {
  const file = KnownRunsheets.get(key);
  if (file)
    load(RunsheetDir, file, (json: any) => {
      cb(RJSON.deserialize(json));
    });
}

export function SaveRunsheet(id: string, runsheet: Runsheet) {
  const key = RunsheetList().find((key: StorageKey) => key.id === id);
  if (key) {
    const file = KnownRunsheets.get(key);
    if (file) save(RunsheetDir, file, RJSON.serialize(runsheet));
  }
}

export function DeleteRunsheet(key: StorageKey) {
    const file = KnownRunsheets.get(key);
    if (file) deleteFile(RunsheetDir, file,KnownRunsheets);
}

function LoadDir(
  dir: string,
  extension: string,
  cb: (files: string[]) => void
) {
  fs.readdir(dir, (err: Error | null, files: string[]) => {
    if (err) {
      Debug("showrunner:io")(err);
      return cb([]);
    }
    const filtered = files
      .map((filename: string) => path.join(dir, filename))
      .filter((filePath: string) => path.extname(filePath) === extension);
    cb(filtered);
  });
}

function Discover(dir: string, output: Map<StorageKey, string>) {
  fs.access(dir, (err: Error | null) => {
    if (err) return;
    LoadDir(dir, ".json", (files: string[]) => {
      output.clear();
      files.forEach((file: string) => {
        const re = path.basename(file, ".json");
        const name = re.split("/").pop() || re;
        let RName = name;
        load(dir, name, (json: any) => {
          if (json.display && json.id) RName = json.display;
          if(!output.has({ display: RName, id: json.id}))
          output.set({ display: RName, id: json.id }, name);
        });
      });
    });
  });
}

function load(dir: string, name: string, cb: (json: any) => void) {
  fs.readFile(`${dir}/${name}.json`, (err: Error | null, buffer: Buffer) => {
    if (err) Debug("showrunner:io")(err);
    else cb(JSON.parse(buffer.toString()));
  });
}

function save(dir: string, name: string, json: any): void {
  fs.writeFile(
    `${dir}/${name}.json`,
    JSON.stringify(json),
    (err: Error | null) => {
      if (err) Debug("showrunner:io")(err);
    }
  );
}

function deleteFile(dir: string, name: string,output:Map<StorageKey,string>): void {
  fs.unlink(`${dir}/${name}.json`, () => {});
}

export function RunsheetList(): StorageKey[] {
  return Array.from(KnownRunsheets.keys());
}

export function TemplateList(): StorageKey[] {
  return Array.from(KnownRunsheets.keys());
}
