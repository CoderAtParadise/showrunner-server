import Tracking from "./tracking";

export namespace Commands {
  interface location {
    session: number;
    bracket?: number;
    item?: number;
  }

  export const goto = (location: location) => {
    const session = Tracking.getTracking("session");
    let gotoSession: Tracking.Tracker;
    if (Tracking.getIndex(session) !== location.session) {
      gotoSession = Tracking.getByIndex(location.session);
      Tracking.endTracking(session);
      Tracking.startTracking(gotoSession);
    } else {
      gotoSession = session;
    }
  };

  export const change_disable_state = (location: location) => {};

  export const delete_at = (location: location) => {};

  export const add_at = (location: location) => {};
}
