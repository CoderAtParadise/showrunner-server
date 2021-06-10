import fs from "fs";
import Debug from "debug";
import path from "path";
import Runsheet, { JSON as RJSON } from "../common/Runsheet";
import ServerRunsheet from "./ServerRunsheetHandler";

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
  Watch(RunsheetDir, KnownRunsheets);
  Watch(TemplateDir, KnownTemplates);
  Watch(StagePlotDir, KnownStagePlots);
  setInterval(() => {
    if(ServerRunsheet.runsheet && ServerRunsheet.dirty())
      SaveRunsheet(ServerRunsheet.runsheet.id,ServerRunsheet.runsheet);
      ServerRunsheet.dirtyV = false;
  },3000);
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

function SaveRunsheet(id:string,runsheet:Runsheet) {
  const key = RunsheetList().find((key:StorageKey) => key.id === id);
  if(key) {
    const file = KnownRunsheets.get(key);
    if(file)
    save(RunsheetDir,file,RJSON.serialize(runsheet));
  }
}

function Watch(dir: string, storage: Map<StorageKey, string>) {
  Discover(dir, storage);
  fs.watch(dir, (): void => Discover(dir, storage));
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
  output.clear();
  fs.access(dir, (err: Error | null) => {
    if (err) return;
    LoadDir(dir, ".json", (files: string[]) => {
      files.forEach((file: string) => {
        const re = path.basename(file, ".json");
        const name = re.split("/").pop() || re;
        let RName = name;
        load(dir, name, (json: any) => {
          if (json.display && json.id) RName = json.display;
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

export function RunsheetList(): StorageKey[] {
  return Array.from(KnownRunsheets.keys());
}

export function TemplateList(): StorageKey[] {
  return Array.from(KnownRunsheets.keys());
}