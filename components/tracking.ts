import Time from "./time";
import Timer from "./timer";
import Structure from "./structure";
import Control from "./control";
import { eventhandler, schedule } from "./eventhandler";

namespace Tracking {
  export interface Tracker {
    sessionId: string;
    tracking: Structure.Storage;
    timers: Timer.Tracking[];
    trackingIndex: number;
  }

  export interface Nested {
    nested: Tracker[];
    nestedType: string;
  }

  interface Dirty {
    dirty: boolean;
  }

  export const sessionManager: Nested & Dirty = {
    nested: [],
    nestedType: "session",
    dirty: false,
  };

  export const setupTracking = (
    runsheet: Structure.Runsheet.RunsheetStorage
  ): void => {
    sessionManager.nested.length = 0;
    runsheet.nested.forEach((storage: Structure.Storage) => {
      if ("start" in storage) {
        (storage as Structure.Session.SessionStart).start.forEach(
          (time: Time.Point) => {
            sessionManager.nested.push(
              createTracking("", Time.copy(time), storage)
            );
          }
        );
      }
    });
  };

  const rebuildTracking = (location: Control.Location, end: boolean) => {};

  const createTracking = (
    sessionId: string,
    time: Time.Point,
    storage: Structure.Storage
  ): Tracker => {
    if ("nested" in storage) {
      let tracking: Tracker & Nested = {
        sessionId: sessionId,
        tracking: storage,
        trackingIndex: -1,
        timers: [
          {
            start: Time.copy(time),
            end: Time.add(time, (storage as Structure.Storage).timer.duration), //We lose typing here somehow
            show: (storage as Structure.Storage).timer.show,
          },
        ],
        nestedType: (storage as Structure.Nested).nestedType,
        nested: [],
      };
      (storage as Structure.Nested).nested.forEach(
        (value: Structure.Storage) => {
          tracking.nested.push(createTracking(sessionId, time, value));
          time = Time.add(time, value.timer.duration);
        }
      );
      return tracking;
    } else {
      return {
        sessionId: sessionId,
        tracking: storage,
        trackingIndex: -1,
        timers: [
          {
            start: Time.copy(time),
            end: Time.add(time, storage.timer.duration),
            show: storage.timer.show,
          },
        ],
      };
    }
  };

  export const startTracking = (tracker: Tracker) => {
    tracker.trackingIndex++;
    tracker.timers[tracker.trackingIndex].start = Time.now();
    tracker.timers[tracker.trackingIndex].end = Time.add(
      Time.now(),
      tracker.tracking.timer.duration
    );
    if ("nested" in tracker) {
      const subtracker = getNext(tracker as Nested);
      startTracking(subtracker);
    }
    setTracking(tracker.tracking.type, tracker);
  };

  export const endTracking = (tracker: Tracker): void => {
    tracker.timers[tracker.trackingIndex].end = Time.now();
    setTracking(tracker.tracking.type, invalid_tracking);
  };

  export const getByIndex = (nested: Nested, index: number): Tracker => {
    if (validIndex(nested, index)) {
      return nested.nested[index];
    }
    return invalid_tracking;
  };

  export const getNext = (nested: Nested): Tracker => {
    const active = getTracking(nested.nestedType);
    let index = 0;
    if (!isInvalid(active)) index = getIndex(nested, active);
    while (validIndex(nested, index)) {
      if (nested.nested[index].tracking.disabled) {
        index++;
        continue;
      }
      return getByIndex(nested, index);
    }
    return invalid_tracking;
  };

  export const getIndex = (nested: Nested, active: Tracker): number => {
    return nested.nested.indexOf(active);
  };

  export const validIndex = (nested: Nested, index: number): boolean => {
    return nested.nested.length > index;
  };

  const isInvalid = (tracker: Tracker): boolean => {
    return tracker.sessionId === "INVALID";
  };

  const invalid_tracking: Tracker = {
    sessionId: "INVALID",
    tracking: {
      tracking: "",
      type: "INVALID",
      display: "INVALID",
      disabled: true,
      timer: {
        duration: Time.INVALID,
        behaviour: Timer.Behaviour.HIDE,
        display: Timer.Display.COUNTDOWN,
        show: false,
      }
    },
    timers: [],
    trackingIndex: -1,
  };

  const tracker_map: Map<string, Tracker> = new Map<string, Tracker>();

  export const getTracking = (key: string): Tracker => {
    if (tracker_map.has(key)) {
      const tracking = tracker_map.get(key);
      if (tracking) return tracking;
    }
    return invalid_tracking;
  };

  const setTracking = (key: string, tracker: Tracker): void => {
    tracker_map.set(key, tracker);
    if (!sessionManager.dirty) {
      sessionManager.dirty = true;
      schedule(() => {
        sessionManager.dirty = false;
        eventhandler.emit("sync", "current", getActiveLocation());
      });
    }
  };

  export const getActiveLocation = (): Control.Location => {
    const loc: Control.Location = { session: -1, bracket: -1, item: -1 };
    const session = tracker_map.get("session");
    if (session) {
      loc.session = getIndex(sessionManager, session);
      const bracket = tracker_map.get("bracket");
      if (bracket && "nested" in session) {
        loc.bracket = getIndex(session as Nested, bracket);
        const item = tracker_map.get("item");
        if (item && "nested" in bracket)
          loc.item = getIndex(bracket as Nested, item);
      }
    }
    return loc;
  };

  interface Change {
    location: Control.Location;
    end: boolean;
    value: Time.Point;
  }

  export const tracking_changes: Change[] = [];
}

export default Tracking;
