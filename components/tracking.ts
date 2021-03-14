import Control from "../components/control";
import Structure from "../components/structure";
import Timer from "../components/timer";
import Time from "../components/time";
import { eventhandler } from "../components/eventhandler";

export namespace Tracking {
  export interface Location {
    session: number;
    bracket: number;
    item: number;
  }

  export interface Tracker {
    tracker_list: TrackerList;
    tracking: Structure.Storage;
    timers: Timer.Tracking[];
    index: number;
  }

  export interface TrackerList {
    trackers: Tracker[];
    trackerType: Structure.Type;
  }

  const invalid_tracking: Tracker = {
    tracker_list: {
      trackers: [],
      trackerType: Structure.Type.SESSION,
    },
    tracking: {
      tracking: "INVALID",
      type: "INVALID",
      display: "INVALID",
      disabled: true,
      timer: {
        duration: Time.INVALID,
        behaviour: Timer.Behaviour.HIDE,
        display: Timer.Display.COUNTDOWN,
        show: false,
      },
    },
    timers: [],
    index: -1,
  };
  export const invalid_location = { session: -1, bracket: -1, item: -1 };
  export let activeLocation: Location = invalid_location;

  export const sessionManager: TrackerList & { dirty: boolean } = {
    trackers: [],
    trackerType: Structure.Type.SESSION,
    dirty: false,
  };

  const validIndex = (list: TrackerList, index: number): boolean => {
    return index !== -1 && list.trackers.length > index;
  };

  const getByIndex = (list: TrackerList, index: number): Tracker => {
    if (validIndex(list, index)) return list.trackers[index];
    return invalid_tracking;
  };

  export const validLocation = (location: Location): boolean => {
    return location.session !== -1;
  };

  export const get = (location: Location): Tracker => {
    if (validIndex(sessionManager, location.session)) {
      const session: Tracker = getByIndex(sessionManager, location.session);
      if ("trackers" in session) {
        if (!validIndex(session as TrackerList, location.bracket))
          return session;
        const bracket: Tracker = getByIndex(session, location.bracket);
        if ("trackers" in bracket) {
          if (!validIndex(bracket as TrackerList, location.item))
            return bracket;
          return getByIndex(bracket, location.item);
        }
      }
    }
    return invalid_tracking;
  };

  const locator = (
    tracker: Tracker,
    location: Location = { session: -1, bracket: -1, item: -1 }
  ): Location => {
    location[
      tracker.tracker_list.trackerType
    ] = tracker.tracker_list.trackers.indexOf(tracker);
    if ("tracker_list" in tracker.tracker_list)
      return locator(tracker.tracker_list as Tracker, location);
    return location;
  };

  const validNext = (tracker: Tracker): boolean => {
    return !tracker.tracking.disabled;
  };

  export const startTracking = (tracker: Tracker, location: Location): void => {
    tracker.index++;
    if(tracker.index >= tracker.timers.length) {
      tracker.timers.push(
        {
          start: Time.INVALID,
          end: Time.INVALID,
          show: tracker.tracking.timer.show,
        }
      )
    }
    const timer: Timer.Tracking = tracker.timers[tracker.index];
    timer.start = Time.now();
    timer.end = Time.add(Time.now(), tracker.tracking.timer.duration);
  };

  export const endTracking = (tracker: Tracker, location: Location): void => {
    tracker.timers[tracker.index].end = Time.now();
  };

  export const next = (): Location => {
    let location: Location;
    if (Control.isRunsheetLoaded())
      if (validLocation(activeLocation))
        location = {
          session: activeLocation.session,
          bracket: activeLocation.bracket,
          item: activeLocation.bracket + 1,
        };
      else location = { session: 0, bracket: 0, item: 0 };
    else {
      return invalid_location;
    }
    for (let s = location.session; s < sessionManager.trackers.length; s++) {
      const session = sessionManager.trackers[s];
      if (session && !validNext(session)) {
        continue;
      }

      if ("trackers" in session) {
        for (
          let b = location.bracket;
          b < (session as TrackerList).trackers.length;
          b++
        ) {
          const bracket = (session as TrackerList).trackers[b];
          if (bracket && !validNext(bracket))
            continue;
          if ("trackers" in bracket) {
            for (
              let i = location.item;
              i < (bracket as TrackerList).trackers.length;
              i++
            ) {
              const item = (bracket as TrackerList).trackers[i];
              if (item && validNext(item))
                return { session: s, bracket: b, item: i };
            }
            location.item = 0;
          }
        }
        location.bracket = 0;
      }
    }
    return invalid_location;
  };

  export const setupTracking = (
    runsheet: Structure.Runsheet.RunsheetStorage
  ): void => {
    sessionManager.trackers.length = 0;
    runsheet.nested.forEach((storage: Structure.Storage) => {
      if ("start" in storage) {
        (storage as Structure.Session.SessionData).start.forEach(
          (time: Time.Point) => {
            sessionManager.trackers.push(
              createTracking(sessionManager, Time.copy(time), storage)
            );
          }
        );
      }
    });
  };

  const createTracking = (
    list: TrackerList,
    time: Time.Point,
    storage: Structure.Storage
  ): Tracker => {
    if ("nested" in storage) {
      let tracking: Tracker & TrackerList = {
        tracker_list: list,
        tracking: storage,
        index: -1,
        timers: [
          {
            start: Time.copy(time),
            end: Time.add(time, (storage as Structure.Storage).timer.duration), //We lose typing here somehow
            show: (storage as Structure.Storage).timer.show,
          },
        ],
        trackerType: (storage as Structure.Nested).nestedType,
        trackers: [],
      };
      (storage as Structure.Nested).nested.forEach(
        (value: Structure.Storage) => {
          tracking.trackers.push(
            createTracking(tracking, Time.copy(time), value)
          );
          time = Time.add(time, value.timer.duration);
        }
      );
      return tracking;
    } else {
      return {
        tracker_list: list,
        tracking: storage,
        index: -1,
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

  export const rebuildTracking = (from: Location): void => {
    for (let s = from.session; s < sessionManager.trackers.length; s++) {}
  };
  
  interface Sync {
    location: Location;
    timers: {start: string,end:string,show:boolean}[];
  }
 
  const writeSync = (tracker:Tracker): Sync => {
    const timers: {start:string,end:string,show:boolean}[] = [];
    tracker.timers.forEach((timer:Timer.Tracking) => {
      timers.push({start:Time.stringify(timer.start),end:Time.stringify(timer.end),show:timer.show});
    });
    return {location:locator(tracker),timers: timers};
  }
  
  export const syncTracking =(): Sync[] => {
    const syncArray: Sync[] = [];
    sessionManager.trackers.forEach((tracker:Tracker) => {
      syncArray.push(writeSync(tracker));
      if("trackers" in tracker) {
        const session = tracker as TrackerList;
        session.trackers.forEach((tracker:Tracker) => {
          syncArray.push(writeSync(tracker));
          if("trackers" in tracker)
          {
            const bracket = tracker as TrackerList;
            bracket.trackers.forEach((tracker:Tracker)=> {
              syncArray.push(writeSync(tracker));
            })
          }
        });
      }
    });
    return syncArray;
  }
}

export default Tracking;
