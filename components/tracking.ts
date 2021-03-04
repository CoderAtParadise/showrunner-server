import Time from "./time";
import Timer from "./timer";
import Structure from "./structure";

namespace Tracking {
  interface Session {
    id: string;
    session: NestedTracker;
  }

  const sessionManager: {sessions: Session[]} = {
    sessions: [],
  };

  export const populateSessionManager = (runsheet:Structure.Runsheet.RunsheetStorage): void => {
    sessionManager.sessions.length = 0;
  }

  export interface Tracker {
    tracking: Structure.Storage;
    timers: Timer.Tracking[];
    trackingIndex: number;
  }

  export interface NestedTracker extends Tracker {
    nested: Tracker[];
    nestedType: string;
  }

  export const startTracking = (tracker: Tracker) => {
    tracker.trackingIndex++;
    tracker.timers[tracker.trackingIndex].start = Time.now();
    tracker.timers[tracker.trackingIndex].end = Time.add(
      Time.now(),
      tracker.tracking.timer.duration
    );
    tracker.tracking.startTracking(tracker.tracking);
    if("nested" in tracker) {
      const subtracker = getNext(tracker as NestedTracker);
      startTracking(subtracker);
    }
    setTracking(tracker.tracking.type,tracker);
  };

  export const endTracking = (tracker: Tracker) : void => {
    tracker.timers[tracker.trackingIndex].end = Time.now();
    tracker.tracking.startTracking(tracker.tracking);
    setTracking(tracker.tracking.type,invalid_tracking);
  }

  export const getByIndex = (nested:NestedTracker,index:number): Tracker => {
    if(validIndex(nested,index)) {
      return nested.nested[index];
    }
    return invalid_tracking;
  }

  export const getNext = (nested:NestedTracker): Tracker => {
    const active = getTracking(nested.nestedType);
    let index = 0;
    if(!isInvalid(active)) index = getIndex(nested,active);
    while(validIndex(nested,index)) 
    {
      if (nested.nested[index].tracking.disabled) {
        index++;
        continue;
      }
      return getByIndex(nested,index);
    }
    return invalid_tracking;
  }

  export const getIndex = (nested:NestedTracker,active:Tracker): number => {
    return nested.nested.indexOf(active);
  }

  export const validIndex = (nested:NestedTracker,index: number) : boolean => {
    return nested.nested.length > index;
  }

  const isInvalid = (tracker:Tracker) : boolean => {
    return tracker.tracking.type === "INVALID";
  }

  const invalid_tracking: Tracker = {
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
      },
      startTracking: () => {},
      endTracking: () => {},
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

  const setTracking = (key: string,tracker:Tracker): void => {
    tracker_map.set(key,tracker);
  }
}

export default Tracking;
