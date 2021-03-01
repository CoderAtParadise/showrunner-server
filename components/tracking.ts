import Time from "./time";
import Timer from "./timer";
import Structure from "./structure";

namespace Tracking {
  interface SessionID {
    id: string;
  }

  export interface Tracker {
    session: SessionID;
    tracking: Structure.Storage;
    timers: Timer.Tracking[];
    trackingIndex: number;
  }

  export interface NestedTracker extends Tracker {
    nested: Structure.Storage[];
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
    }
    setTracking(tracker.tracking.type,tracker);
  };

  export const endTracking = (tracker: Tracker) => {
    tracker.timers[tracker.trackingIndex].end = Time.now();
    tracker.tracking.startTracking(tracker.tracking);
    setTracking(tracker.tracking.type,invalid_tracking);
  }

  const getNext = (nested:NestedTracker): Tracker => {
    nested.nested
  }

  class Nested<
    T extends Structure.Storage & Structure.Nested
  > extends Tracking {
    active?: Tracking;
    nested: Tracking[] = [];

    constructor(reference: T, start: Time.Point) {
      super(reference);
      reference.nested.forEach((value: Structure.Storage) => {
        this.nested.push(new Tracking(value));
      });
    }

    startTracking() {
      super.startTracking();
      this.goto(this.getNextIndex(), false);
      this.active?.startTracking();
    }

    endTracking() {
      super.endTracking();
      this.active?.endTracking();
    }

    getNextIndex() {
      let index = this.activeIndex() + 1;
      while (this.validIndex(index)) {
        if (this.nested[index].reference.disabled) {
          index++;
          continue;
        }
        return index;
      }
      return -1;
    }

    activeIndex() {
      if (this.active) return this.nested.indexOf(this.active);
      return -1;
    }

    validIndex(index: number) {
      return index < this.nested.length;
    }

    goto(index: number, force: boolean) {
      if (!this.validIndex(index)) return false;
      if (this.active) {
        this.active.endTracking();
      }
      if (force || !this.nested[index].reference.disabled)
        this.active = this.nested[index];
      this.active?.startTracking();
      return true;
    }

    changeDisabledState(index: number) {
      this.nested[index].reference.disabled = !this.nested[index].reference
        .disabled;
    }
  }

  const invalid_tracking: Tracker = {
    session: {
      id: "",
    },
    tracking: {
      tracking: "",
      type: "invalid",
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
