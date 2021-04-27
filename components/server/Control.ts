import { RunsheetStorage, JSON as RJSON } from "../common/Runsheet";
import { Storage, Nested, get, Type } from "../common/Storage";
import "./Messages";
import "./Triggers";
import fs from "fs";
import path from "path";
import {
  buildTrackingSession,
  TrackingSession,
  start,
  end,
  SESSION_JSON as TJSON,
} from "../common/Tracking";
import Debug from "debug";
import EventEmitter from "events";
import { addThisTickHandler } from "./Eventhandler";
import { SessionStorage } from "../common/Session";
import { Point } from "../common/Time";

export const ControlHandler: {
  loaded: RunsheetStorage | undefined;
  tracking: Map<string, TrackingSession>;
  current: {
    session: string;
    active: string;
    next: string;
  };
  eventhandler?: EventEmitter;
} = {
  loaded: undefined,
  tracking: new Map<string, TrackingSession>(),
  current: {
    session: "",
    active: "",
    next: "",
  },
};

export function init(eventhandler: EventEmitter) {
  ControlHandler.eventhandler = eventhandler;
  addThisTickHandler(() => {
    eventhandler.emit("clock");
  });
  Discover(runsheetDir, knownRunsheets);
  Discover(templateDir, knownTemplates);
  fs.watch(runsheetDir, (): void => Discover(runsheetDir, knownRunsheets));
  fs.watch(templateDir, (): void => Discover(templateDir, knownTemplates));
}

export interface Command {
  command: string;
  tracking_id?: string;
  data?: any;
}

export function Goto(command: Command): void {
  if (ControlHandler.loaded) {
    if (command.tracking_id) {
      const session = ControlHandler.tracking.get(
        ControlHandler.current.session
      );
      if (session) {
        if (ControlHandler.current.active !== "") {
          const tracker = session.trackers.get(ControlHandler.current.active);
          if (tracker) {
            end(tracker);
            ControlHandler.eventhandler?.emit("sync", "tracking", {
              id: ControlHandler.current.active,
              tracker: tracker,
            });
          }
        }
        if (session.trackers.has(command.tracking_id)) {
          const tracker = session.trackers.get(command.tracking_id);
          if (tracker?.parent === session.tracking_id) {
            const s = (get(
              ControlHandler.loaded,
              session.tracking_id
            ) as unknown) as Nested;
            const bracket = (get(s, command.tracking_id) as unknown) as Nested;
            const item = getNextEnabled(bracket, -1);
            if(item) {
              ControlHandler.current.active = item.tracking;
              const t = session.trackers.get(item.tracking);
              if(t)
                start(t);
            }
          } else {
            ControlHandler.current.active = command.tracking_id;
            const tracker = session.trackers.get(ControlHandler.current.active);
            if (tracker) start(tracker);
          }
          ControlHandler.current.next = getNext();
          ControlHandler.eventhandler?.emit(
            "sync",
            "current",
            ControlHandler.current
          );
          ControlHandler.eventhandler?.emit("sync", "tracking", {
            id: ControlHandler.current.active,
            tracker: session.trackers.get(ControlHandler.current.active),
          });
        }
      }
    }
  }
}

function getNextEnabled(list: Nested, startIndex: number): Storage | null {
  const index = startIndex + 1;
  while (index < list.index.length) {
    const s = list.index[index];
    const a = get(list, s);
    if (!a.disabled) return a;
  }
  return null;
}

function getNext(): string {
  if (ControlHandler.loaded) {
    if (ControlHandler.current.session === "")
      ControlHandler.current.session = ControlHandler.tracking
        .keys()
        .next().value;
    const trackingSession = ControlHandler.tracking.get(
      ControlHandler.current.session
    );
    const tracking: string = trackingSession?.tracking_id || "";
    const storage: Storage = get(ControlHandler.loaded, tracking);
    if (storage.type !== Type.INVALID) {
      const session = (storage as unknown) as Nested;
      if (ControlHandler.current.active === "") {
        let index: number = -1;
        while (index < session.index.length) {
          let bracket: Nested = (getNextEnabled(
            session,
            index
          ) as unknown) as Nested;
          if (bracket) {
            let bindex: number = -1;
            let item: Storage | null = getNextEnabled(bracket, bindex);
            if (item) return item.tracking;
          }
        }
      } else {
        const active = trackingSession?.trackers.get(
          ControlHandler.current.active
        );
        if (active) {
          let bracket: Nested = (session.nested.get(
            active.parent
          ) as unknown) as Nested;
          let index: number = bracket.index.indexOf(active.tracking_id);
          let item: Storage | null = getNextEnabled(bracket, index);
          if (item) return item.tracking;
          else {
            let bindex: number = session.index.indexOf(active.parent);
            while (bindex < session.index.length) {
              bracket = (getNextEnabled(session, bindex) as unknown) as Nested;
              if (bracket) {
                index = -1;
                item = getNextEnabled(bracket, index);
                if (item) return item.tracking;
              }
            }
          }
        }
      }
    }
  }
  return "";
}

export function LoadRunsheet(command: Command): void {
  const file = command.data as string;
  loadRunsheet(file, (runsheet: any) => {
    if (runsheet.error) Debug("showrunner:io")(runsheet.message);
    else {
      if (ControlHandler.eventhandler) {
        ControlHandler.eventhandler.emit("sync", "runsheet", runsheet);
        ControlHandler.loaded = RJSON.deserialize(runsheet);
        ControlHandler.loaded.nested.forEach((value: Storage) => {
          const session = value as SessionStorage;
          session.start.forEach(
            (value: { session_id: string; time: Point }) => {
              ControlHandler.tracking.set(
                value.session_id,
                buildTrackingSession(value, session)
              );
            }
          );
        });
        const tracking_list: object[] = [];
        ControlHandler.tracking.forEach((value: TrackingSession) =>
          tracking_list.push(TJSON.serialize(value))
        );
        ControlHandler.eventhandler.emit(
          "sync",
          "tracking_list",
          tracking_list
        );
        ControlHandler.current.next = getNext();
        ControlHandler.eventhandler.emit(
          "sync",
          "current",
          ControlHandler.current
        );
      }
    }
  });
}

export function SaveRunsheet(command: Command) {
  const file = command.data as string;
}

const runsheetDir = "storage/runsheets";
const templateDir = "storage/templates";
const knownRunsheets: Map<string, string> = new Map<string, string>();
const knownTemplates: Map<string, string> = new Map<string, string>();

function Discover(dir: string, storage: Map<string, string>): void {
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
