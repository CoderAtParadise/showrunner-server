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
  SESSION_JSON as TSJSON,
  TRACKER_JSON as TJSON,
} from "../common/Tracking";
import Debug from "debug";
import EventEmitter from "events";
import { addThisTickHandler } from "./Eventhandler";
import { SessionStorage } from "../common/Session";
import { now, add, Point, subtract, greaterThan, equals } from "../common/Time";
import { Behaviour, TimerState } from "../common/Timer";

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
  eventhandler.addListener("clock", () => {
    if (ControlHandler.loaded) {
      const session = ControlHandler.tracking.get(
        ControlHandler.current.session
      );
      if (session) {
        const tracker = session.trackers.get(ControlHandler.current.active);
        if (tracker) {
          const time = subtract(now(),tracker.timers[tracker.index].start);
          if (equals(time, tracker.settings.duration) && tracker.timers[tracker.index].state === TimerState.RUNNING) {
            switch (tracker.settings.behaviour) {
              case Behaviour.OVERRUN:
                tracker.timers[tracker.index].state = TimerState.OVERRUN;
                break;
              case Behaviour.HIDE:
                end(tracker);
                tracker.timers[tracker.index].state = TimerState.HIDDEN;
                break;
              case Behaviour.STOP:
                end(tracker);
                tracker.timers[tracker.index].state = TimerState.STOPPED;
                break;
            }
            ControlHandler.eventhandler?.emit("sync", "tracking", {
              session: ControlHandler.current.session,
              tracker: TJSON.serialize(tracker),
            });
          }
        }
      }
    }
  });
  Discover(runsheetDir, knownRunsheets);
  Discover(templateDir, knownTemplates);
  fs.watch(runsheetDir, (): void => Discover(runsheetDir, knownRunsheets));
  fs.watch(templateDir, (): void => Discover(templateDir, knownTemplates));
}

export interface Command {
  command: string;
  session: string;
  tracking_id: string;
  data?: any;
}

export function StartSession(session: string): void {
  if (ControlHandler.loaded) {
    if (ControlHandler.tracking.has(session)) {
      ControlHandler.current.session = session;
      const tracker = ControlHandler.tracking.get(session);
      if (tracker) {
        tracker.timer.start = now();
        tracker.timer.end = add(now(), tracker.settings.duration);
        ControlHandler.eventhandler?.emit("sync", "tracking_session", TSJSON.serialize(tracker));
      }
    } else ControlHandler.current.session = "";
  }
}

export function EndSession(session: string): void {
  if (ControlHandler.loaded) {
    const tracker = ControlHandler.tracking.get(session);
    if (tracker) {
      tracker.timer.end = now();
      ControlHandler.eventhandler?.emit("sync", "tracking_session", TSJSON.serialize(tracker));
    }
    ControlHandler.current.session = "";
    ControlHandler.current.active = "";
    ControlHandler.current.next = "";
  }
}

export function Disable(command:Command) :void {
  if (ControlHandler.loaded)
  {
    
  }
}

export function Goto(command: Command): void {
  if (ControlHandler.loaded) {
    if (ControlHandler.current.session !== command.session || command.tracking_id === "start") {
      const session = ControlHandler.tracking.get(
        ControlHandler.current.session
      );
      if (session) {
        const item = session.trackers.get(ControlHandler.current.active);
        if (item && (item.timers[item.index].state === TimerState.RUNNING || item.timers[item.index].state == TimerState.OVERRUN)) {
          end(item);
          ControlHandler.eventhandler?.emit("sync", "tracking", {
            session: ControlHandler.current.session,
            tracker: TJSON.serialize(item),
          });
          const bracket = session.trackers.get(item.parent);
          if (bracket && (bracket.timers[bracket.index].state === TimerState.RUNNING || bracket.timers[bracket.index].state == TimerState.OVERRUN)) {
            end(bracket);
            ControlHandler.eventhandler?.emit("sync", "tracking", {
              session: ControlHandler.current.session,
              tracker: TJSON.serialize(bracket),
            });
          }
        }
      }
      EndSession(ControlHandler.current.session);
      StartSession(command.session);
    }
    const session = ControlHandler.tracking.get(command.session);
    if (session) {
      let goto = session.trackers.get(command.tracking_id);
      if (goto) {
        const active = session.trackers.get(ControlHandler.current.active);
        if (active && (active.timers[active.index].state === TimerState.RUNNING || active.timers[active.index].state == TimerState.OVERRUN)) {
          end(active);
          ControlHandler.eventhandler?.emit("sync", "tracking", {
            session: command.session,
            tracker: TJSON.serialize(active),
          });
          if (goto.parent !== active.parent) {
            const parent = session.trackers.get(active.parent);
            if (parent && (parent.timers[parent.index].state === TimerState.RUNNING || parent.timers[parent.index].state == TimerState.OVERRUN)) {
              end(parent);
              ControlHandler.eventhandler?.emit("sync", "tracking", {
                session: command.session,
                tracker: TJSON.serialize(parent),
              });
            }
          }
        }
        if (command.tracking_id !== "") {
          if (goto.parent === session.tracking_id) {
            const ss = get(ControlHandler.loaded, session.tracking_id);
            const bs = get((ss as unknown) as Nested, goto.tracking_id);
            const next = getNextEnabled((bs as unknown) as Nested, -1);
            if (next) {
              const tracker = session.trackers.get(next.tracking);
              if (tracker) {
                ControlHandler.current.active = tracker.tracking_id;
                start(tracker);
                ControlHandler.eventhandler?.emit("sync", "tracking", {
                  session: command.session,
                  tracker: TJSON.serialize(tracker),
                });
              }
              const btracker = session.trackers.get(bs.tracking);
              if (btracker) {
                start(btracker);
                ControlHandler.eventhandler?.emit("sync", "tracking", {
                  session: command.session,
                  tracker: TJSON.serialize(btracker),
                });
              }
            }
          } else {
            const ss = get(ControlHandler.loaded, session.tracking_id);
            const bs = get((ss as unknown) as Nested, goto.parent);
            const next = get((bs as unknown) as Nested, goto.tracking_id);
            if (next) {
              const tracker = session.trackers.get(next.tracking);
              if (tracker) {
                ControlHandler.current.active = tracker.tracking_id;
                start(tracker);
                ControlHandler.eventhandler?.emit("sync", "tracking", {
                  session: command.session,
                  tracker: TJSON.serialize(tracker),
                });
              }
              if (goto.parent !== active?.parent) {
                const btracker = session.trackers.get(goto.parent);
                if (btracker) {
                  start(btracker);
                  ControlHandler.eventhandler?.emit("sync", "tracking", {
                    session: command.session,
                    tracker: TJSON.serialize(btracker),
                  });
                }
              }
            }
          }
        }
      }
      else {
        ControlHandler.current.active = "";
      }
      ControlHandler.current.next = getNext();
      ControlHandler.eventhandler?.emit(
        "sync",
        "current",
        ControlHandler.current
      );
    }
  }
}

function getNextEnabled(list: Nested, startIndex: number): Storage | null {
  let index = startIndex + 1;
  while (index < list.index.length) {
    const s = list.index[index];
    const a = get(list, s);
    if (!a.disabled) return a;
    index++;
  }
  return null;
}

function getNext(): string {
  if (ControlHandler.loaded) {
    if (ControlHandler.current.session === "") return "";
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
              bindex++;
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
          tracking_list.push(TSJSON.serialize(value))
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
  fs.mkdir(dir, () => { });
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
