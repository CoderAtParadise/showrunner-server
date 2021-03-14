import { eventhandler } from "./eventhandler";
import Tracking from "./tracking";
import Structure from "./structure";
import { cpuUsage } from "node:process";

export namespace Control {
  export interface Command {
    command: string;
    location?: Tracking.Location;
    data?: any;
  }

  export let loadedRunsheet:
    | Structure.Runsheet.RunsheetStorage
    | undefined = undefined;

  export const isRunsheetLoaded = (): boolean => {
    return loadedRunsheet !== undefined;
  };

  export const rawRunsheet = (): object => {
    if (loadedRunsheet) {
      return Structure.Runsheet.json.serialize(loadedRunsheet);
    }
    return {};
  };

  export const loadRunsheet = (command: Command) => {
    const file = command.data as string;
    Structure.Runsheet.LoadRunsheet(file, (raw: any) => {
      eventhandler.emit("sync", "runsheet", raw);
      loadedRunsheet = Structure.Runsheet.json.deserialize(raw);
      Tracking.setupTracking(loadedRunsheet);
      eventhandler.emit("sync","tracking",Tracking.syncTracking());
    });
  };

  export const goto = (command: Command) => {
    if (command.location) {
      if (Tracking.validLocation(Tracking.activeLocation)) {
        Tracking.endTracking(
          Tracking.get(Tracking.activeLocation),
          Tracking.activeLocation
        ); //end item tracking
        if (
          command.location.item === -1 ||
          command.location.bracket !== Tracking.activeLocation.bracket
        ) {
          const loc: Tracking.Location = {
            session: Tracking.activeLocation.session,
            bracket: Tracking.activeLocation.bracket,
            item: -1,
          };
          Tracking.endTracking(Tracking.get(loc), loc); //end bracket tracking
        }
        if (
          command.location.bracket === -1 ||
          command.location.session !== Tracking.activeLocation.session
        ) {
          const loc: Tracking.Location = {
            session: Tracking.activeLocation.session,
            bracket: -1,
            item: -1,
          };
          Tracking.endTracking(Tracking.get(loc), loc); //end session tracking
        }
      }
      if(command.location.bracket === -1 || command.location.session !== Tracking.activeLocation.session)
      {
        const loc: Tracking.Location = {
          session: command.location.session,
          bracket: -1,
          item: -1
        }
        Tracking.startTracking(Tracking.get(loc),loc);
      }
      if(command.location.item === -1 || command.location.bracket !== Tracking.activeLocation.bracket) {
        const loc: Tracking.Location = {
          session: command.location.session,
          bracket: command.location.bracket,
          item: -1
        }
        Tracking.startTracking(Tracking.get(loc),loc);
      }
      if(command.location.item !== -1) Tracking.startTracking(Tracking.get(command.location),command.location);
      Tracking.activeLocation = command.location;
      eventhandler.emit("sync", "current", {
        active: Tracking.activeLocation,
        next: Tracking.next(),
      });
      Tracking.rebuildTracking(command.location);
      eventhandler.emit("sync","tracking",Tracking.syncTracking());
    }
  };

  export const change_disable_state = (command: Command) => {
    if(command.location) {
      Tracking.get(command.location).tracking.disabled = !Tracking.get(command.location).tracking.disabled;
    }
  };

  export const delete_at = (command: Command) => {};

  export const add_at = (command: Command) => {};
}

export default Control;
