import Tracking from "./tracking";

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

  export const loadTracking = (command:Command) => {
    const file = command.data as string;
    Tracking.setupTracking(file);
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
