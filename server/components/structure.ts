import Timer from "./timer";
import IJson from "./IJson";
import { eventhandler } from "./eventhandler";
import Trigger from "./trigger";
import Message from "./message";
import fs from "fs";
import path from "path";

namespace Structure {
  export interface Storage {
    type: string;
    display: string;
    disabled: boolean;
    timer: Timer.Settings;
    startTracking: (reference: Storage) => void;
    endTracking: (reference: Storage) => void;
  }
  export const typeEqualTo = (storage: Storage, type: string) =>
    type === storage.type;

  export interface Nested {
    nestedType: string;
    nested: Storage[];
  }

  export const addAtIndex = (
    nested: Nested,
    index: number,
    storage: Storage
  ): void => {
    if (typeEqualTo(storage, nested.nestedType))
      nested.nested.splice(index, 0, storage);
  };

  export const add = (nested: Nested, storage: Storage): void => {
    addAtIndex(nested, nested.nested.length, storage);
  };

  export const getAtIndex = (nested: Nested, index: number): Storage => {
    return nested.nested[index];
  };

  export const deleteIndex = (nested: Nested, index: number): void => {
    nested.nested.splice(index, 1);
  };

  export namespace Runsheet {
    export interface Role {
      role: string;
      display: string;
    }

    const runsheetDir = "storage/runsheets";
    const templateDir = "storage/templates";
    const knownRunsheets: Map<string, string> = new Map<string, string>();
    const knownTemplates: Map<string, string> = new Map<string, string>();

    export const Discover = (dir: string, storage: Map<string, string>) => {
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
    };

    export const LoadRunsheet = (
      file: string,
      cb: (runsheet: RunsheetStorage) => void
    ) => Load(file, knownRunsheets, cb);
    export const LoadTemplate = (
      file: string,
      cb: (runsheet: RunsheetStorage) => void
    ) => Load(file, knownTemplates, cb);

    const Load = (
      file: string,
      storage: Map<string, string>,
      cb: (runsheet: RunsheetStorage) => void
    ) => {
      const runsheet = storage.get(file);
      if (runsheet) {
        fs.readFile(runsheet, (err, buffer: Buffer) => {
          if (err) throw err;
          cb(json.deserialize(JSON.parse(buffer.toString())));
        });
      }
    };

    export const SaveRunsheet = (
      filename: fs.PathLike | number,
      runsheet: RunsheetStorage
    ) => Save(filename, runsheetDir, runsheet);
    export const SaveTemplate = (
      filename: fs.PathLike | number,
      runsheet: RunsheetStorage
    ) => Save(filename, templateDir, runsheet);

    const Save = (
      filename: fs.PathLike | number,
      dir: string,
      runsheet: RunsheetStorage
    ): void => {
      const json = JSON.stringify(Runsheet.json.serialize(runsheet));
      fs.writeFile(
        `${runsheetDir}/${filename}.json`,
        json,
        (err: Error | null) => {
          if (err) throw err;
        }
      );
    };

    const startTracking = (): void => {
      eventhandler.emit("switch:runsheet");
    };

    Discover(runsheetDir, knownRunsheets);
    Discover(templateDir, knownRunsheets);
    fs.watch(runsheetDir, (): void =>
      Discover(runsheetDir, knownRunsheets)
    );
    fs.watch(runsheetDir, (): void =>
      Discover(templateDir, knownTemplates)
    );

    export interface RunsheetStorage extends Nested {
      version: number;
      team: Map<string, Role>;
      nested: Storage[];
      switch: () => void;
    }

    export const getRole = (
      runsheet: RunsheetStorage,
      key: string
    ): Role | undefined => {
      return runsheet.team.get(key);
    };

    export const getAllForRole = (
      runsheet: RunsheetStorage,
      role: string
    ): Role[] => {
      const personel: Role[] = [];
      runsheet.team.forEach((value: Role) => {
        if (value.display === role) personel.push(value);
      });
      return personel;
    };

    export const json: IJson<RunsheetStorage> = {
      serialize(value: RunsheetStorage): object {
        const obj: {
          version: number;
          team: { key: string; role: string; display: string }[];
          sessions: object[];
        } = {
          version: 1,
          team: [],
          sessions: [],
        };
        value.team.forEach((value: Role, key: string) =>
          obj.team.push({ key: key, role: value.role, display: value.display })
        );
        value.nested.forEach((value: Storage) =>
          obj.sessions.push(
            Session.JSON.serialize(value as Session.SessionStorage)
          )
        );
        return obj;
      },

      deserialize(json: object): RunsheetStorage {
        const value = json as {
          version: number;
          team: { key: string; role: string; display: string }[];
          sessions: object[];
        };
        const sessions: Storage[] = [];
        const team: Map<string, Role> = new Map<string, Role>();
        value.team.forEach(
          (json: { key: string; role: string; display: string }) =>
            team.set(json.key, { role: json.role, display: json.display })
        );
        value.sessions.forEach((json: object) =>
          sessions.push(Session.JSON.deserialize(json))
        );
        return {
          version: value.version,
          team: team,
          nestedType: "session",
          nested: sessions,
          switch: startTracking,
        };
      },
    };
  }

  namespace Session {
    const startTracking = (): void => {
      eventhandler.emit("switch:session");
    };

    const endTracking = (): void => {};

    export interface SessionStorage extends Storage, Nested {}

    export const JSON: IJson<SessionStorage> = {
      serialize(value: SessionStorage): object {
        const obj: {
          display: string;
          disabled: boolean;
          timer: {};
          brackets: object[];
        } = {
          display: value.display,
          disabled: value.disabled || false,
          timer: Timer.JSON.serialize(value.timer),
          brackets: [],
        };
        value.nested.forEach((value: Storage) =>
          obj.brackets.push(
            Bracket.JSON.serialize(value as Bracket.BracketStorage)
          )
        );
        return obj;
      },

      deserialize(json: object): SessionStorage {
        const value = json as {
          display: string;
          disabled: boolean;
          timer: {};
          brackets: object[];
        };
        const brackets: Storage[] = [];
        value.brackets.forEach((json: object) =>
          brackets.push(Bracket.JSON.deserialize(json))
        );
        return {
          type: "session",
          display: value.display,
          disabled: value.disabled,
          timer: Timer.JSON.deserialize(value.timer),
          nestedType: "bracket",
          nested: brackets,
          startTracking: startTracking,
          endTracking: endTracking,
        };
      },
    };
  }

  namespace Bracket {
    const startTracking = (): void => {
      eventhandler.emit("switch:bracket");
    };
    const endTracking = (): void => {};

    export interface BracketStorage extends Storage, Nested {}

    export const JSON: IJson<BracketStorage> = {
      serialize(value: BracketStorage): object {
        const obj: {
          display: string;
          disabled: boolean;
          timer: {};
          items: object[];
        } = {
          display: value.display,
          disabled: value.disabled || false,
          timer: Timer.JSON.serialize(value.timer),
          items: [],
        };
        value.nested.forEach((value: Storage) =>
          obj.items.push(Item.JSON.serialize(value as Item.ItemStorage))
        );
        return obj;
      },

      deserialize(json: object): BracketStorage {
        const value = json as {
          display: string;
          disabled: boolean;
          timer: {};
          items: object[];
        };
        const items: Storage[] = [];
        value.items.forEach((json: object) =>
          items.push(Item.JSON.deserialize(json))
        );
        return {
          type: "bracket",
          display: value.display,
          disabled: value.disabled,
          timer: Timer.JSON.deserialize(value.timer),
          nestedType: "item",
          nested: items,
          startTracking: startTracking,
          endTracking: endTracking,
        };
      },
    };

    namespace Item {
      export interface ItemStorage extends Storage {
        directions: Direction.DirectionStorage[];
      }

      export const startTracking = (reference: Storage) => {
        eventhandler.emit(`switch:item`);
        (reference as ItemStorage).directions.forEach(
          (direction: Direction.DirectionStorage) =>
            Trigger.startListening(direction.trigger)
        );
      };

      const endTracking = (reference: Storage): void => {
        (reference as ItemStorage).directions.forEach(
          (direction: Direction.DirectionStorage) =>
            Trigger.stopListening(direction.trigger)
        );
      };

      export const JSON: IJson<ItemStorage> = {
        serialize(value: ItemStorage): object {
          const obj: {
            display: string;
            disabled: boolean;
            timer: {};
            directions: object[];
          } = {
            display: value.display,
            disabled: value.disabled || false,
            timer: Timer.JSON.serialize(value.timer),
            directions: [],
          };
          value.directions.forEach((value: Direction.DirectionStorage) => {
            obj.directions.push(Direction.JSON.serialize(value));
          });
          return obj;
        },

        deserialize(json: object): ItemStorage {
          const value = json as {
            display: string;
            disabled: boolean;
            timer: {};
            directions: object[];
          };
          const directions: Direction.DirectionStorage[] = [];
          value.directions.forEach((json: object) =>
            directions.push(Direction.JSON.deserialize(json))
          );
          return {
            type: "item",
            display: value.display,
            disabled: value.disabled,
            timer: Timer.JSON.deserialize(value.timer),
            directions: directions,
            startTracking: startTracking,
            endTracking: endTracking,
          };
        },
      };
    }

    namespace Direction {
      export interface DirectionStorage {
        targets: string[];
        trigger: Trigger.ITrigger;
        message: Message.IMessage;
      }

      export const notify = (
        direction: DirectionStorage,
        force: boolean
      ): void => {
        if (direction.trigger.state === Trigger.State.SCHEDULED || force) {
          direction.targets.forEach((target: string) => {
            const messageHandler = Message.handlers.get(direction.message.type);
            if (!Message.handlers)
              console.log(`Unknown message type: ${direction.message.type}`);
            else messageHandler?.handleMessage(target, direction.message);
          });
          direction.trigger.state = Trigger.State.RUN;
          Trigger.stopListening(direction.trigger);
        }
      };

      const invalid_trigger: Trigger.ITrigger = {
        type: "invalid",
        state: Trigger.State.WAITING,
        listener: {
          key: "invalid",
          func: () => {},
        },
      };

      export const JSON: IJson<DirectionStorage> = {
        serialize(value: DirectionStorage): object {
          return {
            targets: value.targets,
            trigger: Trigger.handlers
              .get(value.trigger.type)
              ?.json.serialize(value.trigger),
            message: Message.handlers
              .get(value.message.type)
              ?.json.serialize(value.message),
          };
        },

        deserialize(json: object): DirectionStorage {
          const value = json as {
            targets: string[];
            trigger: { type: string };
            message: { type: string };
          };
          const trigger = Trigger.handlers
            .get(value.trigger.type)
            ?.json.deserialize(value.trigger);
          const message = Message.handlers
            .get(value.message.type)
            ?.json.deserialize(value.message);
          return {
            targets: value.targets,
            trigger: trigger || invalid_trigger,
            message: message,
          };
        },
      };
    }
  }
}

export default Structure;
