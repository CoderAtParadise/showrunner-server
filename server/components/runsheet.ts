import { Session, SessionJson } from "./session";
import IJson from "./IJson";
import fs from "fs";
import path from "path";
import {eventhandler} from "./eventhandler";

interface Role {
  role: string;
  display: string;
}

interface Date {
  day: number;
  month: number;
  year: number;
}

class Runsheet {
  display: string;
  sessions: Session[];
  team: Map<string, Role>;

  constructor(display: string, team: Map<string, Role>, sessions: Session[]) {
    this.display = display;
    this.team = team;
    this.sessions = sessions;
  }

  getSession(index:number) {
    return this.sessions[index];
  }

  addSession(session: Session) {
    this.addSessionAtIndex(this.sessions.length, session);
  }

  addSessionAtIndex(index: number, session: Session) {
    this.sessions.splice(index, 0, session);
  }

  deleteSession(index: number) {
    this.sessions.splice(index, 1);
  }
}

export const RunsheetJson: IJson<Runsheet> = {
  serialize(value: Runsheet): object {
    const obj: {
      version: number;
      display: string;
      team: { key: string; role: string; display: string }[];
      sessions: object[];
    } = {
      version: 1,
      display: value.display,
      team: [],
      sessions: [],
    };
    value.team.forEach((value: Role, key: string) =>
      obj.team.push({ key: key, role: value.role, display: value.display })
    );
    value.sessions.forEach((value: Session) =>
      obj.sessions.push(SessionJson.serialize(value))
    );
    return obj;
  },
  
  deserialize(json: object): Runsheet {
    const value = json as {
      display: string;
      team: { key: string; role: string; display: string }[];
      sessions: object[];
    };
    const sessions: Session[] = [];
    const team: Map<string, Role> = new Map<string, Role>();
    value.team.forEach((json: { key: string; role: string; display: string }) =>
      team.set(json.key, { role: json.role, display: json.display })
    );
    //replace @team() with it's actual value
    value.sessions.forEach((json: object) =>
      sessions.push(SessionJson.deserialize(json))
    );
    return new Runsheet(value.display, team, sessions);
  },
};

let ActiveRunsheet: Runsheet;
const knownRunsheets: Map<string, string> = new Map<string, string>();
const knownTemplates: Map<string, string> = new Map<string, string>();
const INVALID_RUNSHEET: Runsheet = new Runsheet(
  "INVALID",
  new Map<string, Role>(),
  []
);

export const getActiveRunsheet = (): Runsheet => {
  return ActiveRunsheet;
};

export const ListRunsheets = (): string[] => {
  return Array.from(knownRunsheets.keys());
}

export const LoadRunsheet = (filename: string): void => {
  const runsheet = knownRunsheets.get(filename);
  if(runsheet) {
   fs.readFile(runsheet,(err,jsonString:Buffer) => {if(err) throw err;
      const jsonObj = JSON.parse(jsonString.toString());
      ActiveRunsheet = RunsheetJson.deserialize(jsonObj);
      eventhandler.emit("switch:runsheet");
      eventhandler.emit('switch:item');
    });
  }
};

export const saveRunsheet = (filename:fs.PathLike | number): void => {
  const json = JSON.stringify(RunsheetJson.serialize(ActiveRunsheet));
  fs.writeFile(filename,json, (err:Error | null) => {if(err) throw err;})
} 

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

const runsheetDir = "storage/runsheets";
const templateDir = "storage/templates";
filter(runsheetDir, knownRunsheets);
filter(templateDir, knownTemplates);

fs.watch(runsheetDir, (eventType, filename: string): void =>
  filter(runsheetDir, knownRunsheets)
);
fs.watch(templateDir, (eventType, filename: string): void =>
  filter(templateDir, knownTemplates)
);
