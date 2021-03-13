import { eventhandler } from "./eventhandler";
import Tracking from "./tracking";
import Structure from "./structure"

export namespace Control {
  export interface Command {
    command: string;
    location: Location;
    data?: any;
  }

  export interface Location {
    session: number;
    bracket: number;
    item: number;
  }

  export const invalid_location = {session: -1,bracket:-1,item: -1};

  export const load_runsheet = (command:Command) => {
    const file = command.data as string;
    Structure.Runsheet.LoadRunsheet(file, (raw: any) => {
      eventhandler.emit("sync","runsheet",raw);
      Tracking.setupTracking(Structure.Runsheet.json.deserialize(raw));
    });
  }

  export const goto = (command: Command) => {
    const session = Tracking.getTracking("session");
    let gotoSession: Tracking.Tracker;
    if (
      Tracking.getIndex(Tracking.sessionManager, session) !== command.location.session
    ) {
      gotoSession = Tracking.getByIndex(
        Tracking.sessionManager,
        command.location.session
      );
      Tracking.endTracking(session);
      Tracking.startTracking(gotoSession);
    } else {
      gotoSession = session;
    }
  };

  export const change_disable_state = (location: Location) => {};

  export const delete_at = (location: Location) => {};

  export const add_at = (location: Location) => {};
}

export default Control;
