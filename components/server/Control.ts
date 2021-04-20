import { eventhandler } from "./eventHandler";
import { RunsheetStorage, JSON as RJSON } from "../common/Runsheet";
import { Storage, Nested } from "../common/Storage";
import "./Messages";
import "./Triggers";
import fs from "fs";
import path from "path";
import { Tracker } from "../common/Tracking";
import Debug from "debug";

export const ControlHandler: {
  loaded: RunsheetStorage | undefined;
  tracking: Map<
    string,
    Tracker
  > /*,runsheet_map: Map<string,{parent:string,}>*/;
  active: string;
} = {
  loaded: undefined,
  tracking: new Map<string, Tracker>(),
  //runsheet_map: new Map<string,{parent:Nested,}>},
  active: "",
};

export function init()
{
  console.log(eventhandler);
}

export interface Command {
  command: string;
  tracking_id?: string;
  data?: any;
}

export function Goto(command: Command): void {
  if (command.tracking_id) {
    ControlHandler.tracking.has(command.tracking_id);
    ControlHandler.active = command.tracking_id;
  }
}

export function LoadRunsheet(command: Command): void {
  const file = command.data as string;
  console.log(eventhandler);
  loadRunsheet(file, (runsheet: any) => {
    if (runsheet.error) Debug("shorunner:io")(runsheet.message);
    else {
      console.log(eventhandler);
      eventhandler.emit("sync", "runsheet", runsheet);
      ControlHandler.loaded = RJSON.deserialize(runsheet);
    }
  });
}

export const runsheetDir = "storage/runsheets";
export const templateDir = "storage/templates";
export const knownRunsheets: Map<string, string> = new Map<string, string>();
export const knownTemplates: Map<string, string> = new Map<string, string>();

export function Discover(dir: string, storage: Map<string, string>): void {
  fs.mkdir(dir, () => {});
  const LoadDir = (
    dirPath: string,
    extension: string,
    cb: (err: Error | null, files: string[]) => void
  ): void => {
    fs.readdir(dirPath, (err: Error | null, files: string[]) => {
      if (err) return cb(err, []);
      const filtered = files
        .map((filename: string) => path.join(dirPath, filename))
        .filter((filePath: string) => path.extname(filePath) === extension);
      cb(null, filtered);
    });
  };

  const filter = (dirPath: string, output: Map<string, string>): void =>
    LoadDir(dirPath, ".json", (err: Error | null, files: string[]) =>
      files.forEach((file: string) =>
        output.set(path.basename(file, ".json"), file)
      )
    );
  filter(dir, storage);
}

function Load(
  file: string,
  storage: Map<string, string>,
  cb: (runsheet: any) => void
): void {
  const runsheet = storage.get(file);
  if (runsheet) {
    fs.readFile(runsheet, (err, buffer: Buffer) => {
      cb(JSON.parse(buffer.toString()));
    });
  } else cb({ error: true, message: `Failed to load ${file}` });
}

function Save(file: fs.PathLike, dir: string, runsheet: RunsheetStorage): void {
  const json = JSON.stringify(RJSON.serialize(runsheet));
  fs.writeFile(`${dir}/${file}.json`, json, (err: Error | null) => {
    if (err) throw err;
  });
}

function loadRunsheet(file: string, cb: (runsheet: any) => void): void {
  Load(file, knownRunsheets, cb);
}

function loadTemplate(file: string, cb: (runsheet: any) => void): void {
  Load(file, knownTemplates, cb);
}

function saveRunsheet(file: fs.PathLike, runsheet: RunsheetStorage) {
  Save(file, runsheetDir, runsheet);
}

function saveTemplate(file: fs.PathLike, runsheet: RunsheetStorage) {
  Save(file, templateDir, runsheet);
}
