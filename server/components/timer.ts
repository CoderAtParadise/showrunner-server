export enum OverrunBehaviour {
  STOP = "stop",
  HIDE = "hide",
  OVERRUN = "overrun",
}

export enum TimerType {
  COUNTDOWN = "countdown",
  ELAPSED = "elapsed",
  Reference = "reference",
}

enum TimeFormat {
  INVALID = "invalid",
  TIME = "time",
  RELSTART = "relstart",
  RELEND = "relend",
}

export class Timepoint {
  static ZEROTIME = new Timepoint(0, 0, 0);
  static INVALID = new Timepoint(0, 0, 0, TimeFormat.INVALID);
  static INTERVAL = new Timepoint(0, 0, 1);

  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  format: TimeFormat;

  constructor(
    hours: number,
    minutes: number,
    seconds: number,
    format: TimeFormat = TimeFormat.RELSTART
  ) {
    this.hours = Math.min(hours, 24);
    this.minutes = Math.min(minutes, 60);
    this.seconds = Math.min(seconds, 60);
    this.format = format;
  }

  static now() {
    let now = new Date();
    return new Timepoint(
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      TimeFormat.TIME
    );
  }

  lessThan(other: Timepoint) {
    if (this.format === TimeFormat.RELEND && other.format === TimeFormat.RELEND)
      return this._lessThan(other);
    else if (
      this.format === TimeFormat.RELEND &&
      other.format === TimeFormat.RELSTART
    )
      return true;
    else if (
      this.format === TimeFormat.RELSTART &&
      other.format === TimeFormat.RELEND
    )
      return false;
    else return this.format === other.format ? this._greaterThan(other) : false;
  }

  greaterThan(other: Timepoint) {
    if (this.format === TimeFormat.RELEND && other.format === TimeFormat.RELEND)
      return this._greaterThan(other);
    else if (
      this.format === TimeFormat.RELEND &&
      other.format === TimeFormat.RELSTART
    )
      return true;
    else if (
      this.format === TimeFormat.RELSTART &&
      other.format === TimeFormat.RELEND
    )
      return false;
    else return this.format === other.format ? this._lessThan(other) : false;
  }

  equals(other: Timepoint) {
    if (
      (this.format === TimeFormat.RELSTART ||
        this.format === TimeFormat.RELEND) &&
      this._equals(Timepoint.ZEROTIME) &&
      other._equals(Timepoint.ZEROTIME)
    )
      return true;
    return this.format === other.format ? this._equals(other) : false;
  }

  subtract(other: Timepoint) {
    if (this._formatEqual(other, TimeFormat.RELEND)) {
      let res = this._subtract(other);
      if (this._lessThan(other)) res.format = TimeFormat.RELSTART;
      else res.format = this.format;
      return res;
    } else if (this._formatOpposite(other)) {
      let res = this._add(other);
      res.format = this.format;
      return res;
    } else {
      if (this._lessThan(other)) {
        let res = other._subtract(this);
        res.format = TimeFormat.RELEND;
        return res;
      } else return this._subtract(other);
    }
  }

  add(other: Timepoint) {
    if (this._formatEqual(other, TimeFormat.RELEND)) {
      let res = this._add(other);
      res.format = TimeFormat.RELEND;
      return res;
    } else if (this._formatOpposite(other)) {
      let res = this._subtract(other);
      res.format = other.format;
      return res;
    } else return this._add(other);
  }

  tostring() {
    return this.format === TimeFormat.INVALID
      ? "--:--:--"
      : `${
          this.format === TimeFormat.RELSTART
            ? "+"
            : this.format === TimeFormat.RELEND
            ? "-"
            : ""
        }${Timepoint.zeroPad(this.hours, 2)}:${Timepoint.zeroPad(
          this.minutes,
          2
        )}:${Timepoint.zeroPad(this.seconds, 2)}`;
  }

  copy() {
    return new Timepoint(this.hours, this.minutes, this.seconds, this.format);
  }

  _formatEqual(other: Timepoint, format: TimeFormat) {
    return this.format === other.format && this.format == format;
  }

  _formatOpposite(other: Timepoint) {
    if (
      (this.format === TimeFormat.RELEND &&
        other.format === TimeFormat.RELSTART) ||
      (this.format === TimeFormat.RELSTART &&
        other.format === TimeFormat.RELEND)
    )
      return true;
    else return false;
  }

  _greaterThan(other: Timepoint) {
    if (this.hours > other.hours) return true;
    if (this.hours === other.hours) {
      if (this.minutes > other.minutes) return true;
      if (this.minutes === other.minutes)
        if (this.seconds > other.seconds) return true;
    }
    return false;
  }

  _lessThan(other: Timepoint) {
    if (this.hours < other.hours) return true;
    if (this.hours === other.hours) {
      if (this.minutes < other.minutes) return true;
      if (this.minutes === other.minutes)
        if (this.seconds < other.seconds) return true;
    }
    return false;
  }

  _equals(other: Timepoint) {
    return this.hours === other.hours
      ? this.minutes === other.minutes
        ? this.seconds === other.seconds
          ? true
          : false
        : false
      : false;
  }

  _subtract(other: Timepoint) {
    let tis = (this.hours * 60 + this.minutes) * 60 + this.seconds;
    let otis = (other.hours * 60 + other.minutes) * 60 + other.seconds;
    let res = Math.abs(tis - otis);
    let seconds = res % 60;
    res = Math.floor(res / 60);
    let minutes = res % 60;
    let hours = Math.floor(res / 60);
    return new Timepoint(hours, minutes, seconds, this.format);
  }

  _add(other: Timepoint) {
    let tis = (this.hours * 60 + this.minutes) * 60 + this.seconds;
    let otis = (other.hours * 60 + other.minutes) * 60 + other.seconds;
    let res = Math.abs(tis + otis);
    let seconds = res % 60;
    res = Math.floor(res / 60);
    let minutes = res % 60;
    let hours = Math.floor(res / 60);
    return new Timepoint(hours, minutes, seconds, this.format);
  }

  _addHelper(other: Timepoint) {}

  private static zeroPad(num: number, places: number) {
    return String(num).padStart(places, "0");
  }
}

interface TimerStatus {
  id: string;
  type: TimerType;
  startpoint: string;
  endpoint: string;
  current: string;
  overrunBehavior: OverrunBehaviour;
  overrun: boolean;
  running: boolean;
}

export class TimerSettings {
  type: TimerType;
  ref?: string;
  overrunBehaviour?: OverrunBehaviour = OverrunBehaviour.STOP;
  time?: Timepoint;
  showTime? = false;
  constructor(params: TimerSettings = {} as TimerSettings) {
    this.type = params.type;
    this.ref = params.ref;
    this.overrunBehaviour = params.overrunBehaviour;
    this.time = params.time;
    this.showTime = params.showTime;
  }
}

export interface Timer {
  id: string;
  type: TimerType;
  overrunBehaviour?: OverrunBehaviour;
  startpoint?: Timepoint;
  endpoint?: Timepoint;
  current?: Timepoint;
  running?: boolean;
  overrun?: boolean;
  currentTimer: () => Timepoint;
  isAtTimepoint: (other: Timepoint) => boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  restart: () => void;
  update: () => void;
  status: (setRunning: boolean | undefined) => TimerStatus;
}

export const loadTimer = (id: string, settings: TimerSettings) => {
  let timer = getTimer(id);
  if (timer) {
    switch (settings.type) {
      case TimerType.Reference:
        timer = new Reference(timer.id, settings.ref || "noop");
        break;
      case TimerType.COUNTDOWN:
        timer = new Countdown(
          timer.id,
          settings.overrunBehaviour || OverrunBehaviour.STOP,
          settings.time || Timepoint.ZEROTIME.copy()
        );
        break;
      case TimerType.ELAPSED:
        timer = new Elapsed(
          timer.id,
          settings.overrunBehaviour || OverrunBehaviour.STOP,
          settings.time || Timepoint.INVALID
        );
        break;
    }
    timer.reset();
  }
};

export class Countdown implements Timer {
  id: string;
  type = TimerType.COUNTDOWN;
  overrunBehaviour: OverrunBehaviour;
  startpoint: Timepoint;
  endpoint = Timepoint.ZEROTIME.copy();
  current = Timepoint.INVALID.copy();
  running = false;
  overrun = false;
  constructor(
    id: string,
    overrunBehaviour: OverrunBehaviour,
    startpoint: Timepoint
  ) {
    this.id = id;
    this.overrunBehaviour = overrunBehaviour;
    this.startpoint = startpoint;
  }

  currentTimer() {
    return this.current;
  }

  update() {
    if (this.running) {
      this.current = this.current.subtract(Timepoint.INTERVAL);
      if (this.current.equals(this.endpoint)) {
        this.overrun = true;
        if (
          this.overrunBehaviour === OverrunBehaviour.STOP ||
          this.overrunBehaviour === OverrunBehaviour.HIDE
        )
          this.stop();
      }
    }
  }

  isAtTimepoint(timepoint: Timepoint) {
    if (timepoint.format === TimeFormat.RELEND)
      return this.current._equals(timepoint);
    else if (timepoint.format === TimeFormat.RELSTART) {
      let ac = this.startpoint.subtract(this.current);
      return ac._equals(timepoint);
    }
    return false;
  }

  start() {
    if (this.current.format === TimeFormat.INVALID) this.reset();
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.stop();
    this.current = this.startpoint.copy();
    this.overrun = false;
  }

  restart() {
    this.reset();
    this.start();
  }

  status(setRunning: boolean | undefined) {
    return {
      id: this.id,
      type: this.type,
      startpoint: this.startpoint.tostring(),
      endpoint: this.endpoint.tostring(),
      current: this.current.tostring(),
      overrunBehavior: this.overrunBehaviour,
      overrun: this.overrun,
      running: setRunning !== undefined ? setRunning : this.running,
    };
  }
}

export class Elapsed implements Timer {
  id: string;
  type = TimerType.ELAPSED;
  overrunBehaviour: OverrunBehaviour;
  startpoint = Timepoint.ZEROTIME.copy();
  endpoint = Timepoint.INVALID.copy();
  current = Timepoint.INVALID.copy();
  running = false;
  overrun = false;
  constructor(
    id: string,
    overrunBehaviour: OverrunBehaviour,
    endpoint?: Timepoint
  ) {
    this.id = id;
    this.overrunBehaviour = overrunBehaviour;
    if (endpoint) this.endpoint = endpoint;
  }

  currentTimer() {
    return this.current;
  }

  update() {
    if (this.running) {
      this.current = this.current.add(Timepoint.INTERVAL);
      if (this.current.equals(this.endpoint)) {
        this.overrun = true;
        if (
          this.overrunBehaviour === OverrunBehaviour.STOP ||
          this.overrunBehaviour === OverrunBehaviour.HIDE
        )
          this.stop();
      }
    }
  }

  isAtTimepoint(timepoint: Timepoint) {
    if (this.endpoint.format === TimeFormat.INVALID)
      return this.current._equals(timepoint);
    else if (timepoint.format === TimeFormat.RELEND) {
      let ac = this.endpoint.subtract(this.current);
      return ac._equals(timepoint);
    } else if (timepoint.format === TimeFormat.RELSTART)
      return this.current._equals(timepoint);
    return false;
  }

  start() {
    if (this.current.format === TimeFormat.INVALID) this.reset();
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.stop();
    this.current = this.startpoint.copy();
    this.overrun = false;
  }

  restart() {
    this.reset();
    this.start();
  }

  status(setRunning: boolean | undefined) {
    return {
      id: this.id,
      type: this.type,
      startpoint: this.startpoint.tostring(),
      endpoint: this.endpoint.tostring(),
      current: this.current.tostring(),
      overrunBehavior: this.overrunBehaviour,
      overrun: this.overrun,
      running: setRunning !== undefined ? setRunning : this.running,
    };
  }
}

export class Reference implements Timer {
  id: string;
  type = TimerType.Reference;
  ref: string;

  constructor(id: string, ref: string) {
    this.id = id;
    this.ref = ref;
  }

  currentTimer() {
    return getTimer(this.ref)?.currentTimer() || Timepoint.INVALID;
  }

  isAtTimepoint(other: Timepoint) {
    return getTimer(this.ref)?.isAtTimepoint(other) || false;
  }

  status(setRunning: boolean | undefined) {
    return (
      getTimer(this.ref)?.status(setRunning) || {
        id: this.id,
        type: this.type,
        startpoint: Timepoint.INVALID.tostring(),
        endpoint: Timepoint.INVALID.tostring(),
        current: Timepoint.INVALID.tostring(),
        overrunBehavior: OverrunBehaviour.HIDE,
        overrun: false,
        running: false,
      }
    );
  }

  update() {
    //noop
  }

  start() {
    //noop
  }

  stop() {
    //noop
  }

  reset() {
    //noop
  }

  restart() {
    //noop
  }
}

const timers = new Map<string, Timer>();

export const getTimers = timers;

export const getTimer = (id: string) => {
  return timers.get(id);
};

export const addTimer = (timer: Timer) => {
  timers.set(timer.id, timer);
};
import { eventhandler, addThisTickHandler } from "./eventhandler";
addThisTickHandler(() => {
  timers.forEach((timer: Timer) => {
    timer.update();
  });
  eventhandler.emit("timer");
});

addTimer(new Elapsed("session", OverrunBehaviour.STOP));
addTimer(new Elapsed("bracket", OverrunBehaviour.STOP));
addTimer(new Elapsed("item", OverrunBehaviour.STOP));

/*import Debug from "debug";
const debug = Debug("showrunner:tests");

const t1 = new Timepoint(1, 2, 3, TimeFormat.RELSTART);
const t2 = new Timepoint(1, 2, 3, TimeFormat.RELEND);
const t3 = new Timepoint(4, 5, 6, TimeFormat.RELSTART);
const t4 = new Timepoint(4, 5, 6, TimeFormat.RELEND);

debug(t1.add(t2)); //-00:00:00
debug(t1.subtract(t2)); //+02:04:06
debug(t2.add(t1)); //+00:00:00
debug(t2.subtract(t1)); //-02:04:06
debug(t1.add(t1)); //+02:04:06
debug(t1.subtract(t1)); //+00:00:00
debug(t2.add(t2)); //-02:04:06
debug(t2.subtract(t2)); //-00:00:00
debug(t1.add(t3)); //+05:07:09
debug(t1.subtract(t3)); //-03:03:03
debug(t1.add(t4)); //-03:03:03
debug(t1.subtract(t4)); //+05:07:09
debug(t2.add(t3)); //+03:03:03
debug(t2.subtract(t3)); //-05:07:09
debug(t2.add(t4)); //-05:07:09
debug(t2.subtract(t4)); //+03:03:03

const tt1 = new Countdown("tt1", OverrunBehaviour.STOP, new Timepoint(0, 5, 0));
tt1.start();
tt1.update();
debug(tt1);*/
