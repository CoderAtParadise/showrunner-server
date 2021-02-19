import { Timepoint, TimerSettings } from "./timer";

export interface ITrackable {
  clock: TimerSettings;
  disabled: boolean;
}

interface Tracking<T> {
  reference: T;
  disabled: boolean;
  start: Timepoint;
  end: Timepoint;
  startTracking: () => void;
  endTracking: () => void;
}

class TrackingNested<T extends ITrackable, U extends ITrackable>
  implements Tracking<T> {
  reference: T;
  start: Timepoint;
  end: Timepoint;
  disabled: boolean = false;
  active?: Tracking<U>;
  nested: Tracking<U>[] = [];

  constructor(reference: T, start: Timepoint) {
    this.reference = reference;
    this.start = start.copy();
    start = start._add(reference.clock.time || Timepoint.ZEROTIME);
    this.end = start.copy();
  }

  startTracking() {
    this.start = Timepoint.now();
  }

  endTracking() {
    this.end = Timepoint.now();
  }

  activeIndex() {
    if (this.active) return this.nested.indexOf(this.active);
    return -1;
  }

  validIndex(index: number) {
    return index < this.nested.length;
  }

  goto(index: number) {
    if (!this.validIndex(index)) return;
    if (this.active) {
      this.active.endTracking();
    }
    if (!this.nested[index].disabled) this.active = this.nested[index];
    this.active?.startTracking();
  }

  changeDisabledState(index: number) {
    this.nested[index].start = Timepoint.INVALID;
    this.nested[index].end = Timepoint.INVALID;
    this.nested[index].disabled = !this.nested[index].disabled;
    this.setupTracking();
  }

  setupTracking() {
    let next: Timepoint = this.start;
    this.nested.forEach((tracking: Tracking<U>) => {
      if (!tracking.disabled) {
        tracking.start = next.copy();
        next = next._add(tracking.reference.clock.time || Timepoint.ZEROTIME);
        tracking.end = next.copy();
      }
    });
  }
}
