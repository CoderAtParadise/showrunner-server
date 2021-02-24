import Structure from "./structure";
import Time from "./time";
import Timer from "./timer";

namespace Tracking {
  class Tracking {
    reference: Structure.Storage;
    timer: Timer.Tracking[] = [];
    trackingIndex: number = -1;

    constructor(reference: Structure.Storage) {
      this.reference = reference;
    }

    startTracking() {
      this.trackingIndex++;
      this.timer[this.trackingIndex].start = Time.now();
      this.timer[this.trackingIndex].end = Time.add(
        Time.now(),
        this.reference.timer.duration
      );
      this.reference.switch();
    }

    endTracking() {
      this.timer[this.trackingIndex].end = Time.now();
    }
  }

  class Nested<T extends Structure.Storage & Structure.Nested> extends Tracking {
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
      this.reference.switch();
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
}

export default Tracking;
