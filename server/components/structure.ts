import Timer from "./timer";
import IJson from "./IJson";
import { eventhandler } from "./eventhandler";
import { Direction } from "./direction";
import { ITrigger } from "./trigger";
import { IMessage } from "./message";

namespace Structure {
  export interface Storage {
    type: string;
    display: string;
    disabled: boolean;
    timer: Timer.Settings;
    switch: () => void;
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

  namespace Runsheet {
    export interface Role {
      role: string;
      display: string;
    }

    const onSwitch = (): void => {
      eventhandler.emit("switch:runsheet");
    };

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

    export const JSON: IJson<RunsheetStorage> = {
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
          switch: onSwitch,
        };
      },
    };
  }

  namespace Session {
    const onSwitch = (): void => {
      eventhandler.emit("switch:session");
    };

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
          switch: onSwitch,
        };
      },
    };
  }

  namespace Bracket {
    const onSwitch = (): void => {
      eventhandler.emit("switch:bracket");
    };

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
          switch: onSwitch,
        };
      },
    };

    namespace Item {
      export interface ItemStorage extends Storage {
        directions: Direction[];
      }

      const onSwitch = (): void => {
        eventhandler.emit(`switch:item`);
      };

      export const JSON: IJson<ItemStorage> = {
        serialize(value: Storage): object {
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
          return obj;
        },

        deserialize(json: object): ItemStorage {
          const value = json as {
            display: string;
            disabled: boolean;
            timer: {};
            directions: object[];
          };
          const directions: Direction[] = [];
          return {
            type: "item",
            display: value.display,
            disabled: value.disabled,
            timer: Timer.JSON.deserialize(value.timer),
            directions: directions,
            switch: onSwitch,
          };
        },
      };
    }

    namespace Direction {
      export interface DirectionStorage {
        targets: string[];
        trigger: ITrigger;
        message: IMessage;
      }

      export const JSON: IJson<DirectionStorage> = {
        serialize(value: Direction): object {
          return {
            targets: value.targets,
            trigger: triggerHandlers
              .get(value.trigger.type)
              ?.json.serialize(value.trigger),
            message: messageHandlers
              .get(value.message.type)
              ?.json.serialize(value.message),
          };
        },

        deserialize(json: object): Direction {
          const value = json as {
            targets: string[];
            trigger: { type: string };
            message: { type: string };
          };
          const trigger = triggerHandlers
            .get(value.trigger.type)
            ?.json.deserialize(value.trigger);
          const message = messageHandlers
            .get(value.message.type)
            ?.json.deserialize(value.message);
          return new Direction(value.targets, trigger, message);
        },
      };
    }
  }
}

export default Structure;
