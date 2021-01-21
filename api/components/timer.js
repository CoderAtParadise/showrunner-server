const zeroPad = (num, places) => {
  if (num === undefined) num = 0;
  return String(num).padStart(places, "0");
};

class Timepoint {
  constructor(hours, minutes, seconds, overflow = false) {
    this.hours = Math.min(hours, 24);
    this.minutes = Math.min(minutes, 59);
    this.seconds = Math.min(seconds, 59);
    this.overflow = overflow;
  }

  static parse(string) {
    console.log(string.charAt(0));
    let overflow = string.charAt(0) === "-" ? true : false;
    if (overflow) string = string.slice(1);
    let values = string.split(":");
    let timepoint;
    switch (values.length) {
      case 2:
        timepoint = new Timepoint(
          0,
          Number(values[0]),
          Number(values[1]),
          overflow
        );
        break;
      case 3:
        timepoint = new Timepoint(
          Number(values[0]),
          Number(values[1]),
          Number(values[2]),
          overflow
        );
        break;
      default:
        console.error("Invalid Time format");
        return new Timepoint(0, 0, 0);
    }
    return timepoint;
  }

  static stringify(time) {
    return `${time.overflow ? "-" : ""}${zeroPad(time.hours, 1)}:${zeroPad(
      time.minutes,
      2
    )}:${zeroPad(time.seconds, 2)}`;
  }

  _greaterThan(other) {
    return this.hours > other.hours
      ? true
      : this.minutes > other.minutes
      ? true
      : this.seconds > other.seconds
      ? true
      : false;
  }

  _lessThan(other) {
    return this.hours < other.hours
      ? true
      : this.minutes < other.minutes
      ? true
      : this.seconds < other.seconds
      ? true
      : false;
  }

  _equals(other) {
    return this.hours === other.hours
      ? this.minutes === other.minutes
        ? this.seconds === other.seconds
          ? true
          : false
        : false
      : false;
  }

  _subtract(other) {
    let tis = (this.hours * 60 + this.minutes) * 60 + this.seconds;
    let otis = (other.hours * 60 + other.minutes) * 60 + other.seconds;
    let res = tis - otis;
    let seconds = res % 60;
    res = Math.abs(Math.floor(res / 60));
    let minutes = res % 60;
    let hours = Math.abs(Math.floor(res / 60));
    return new Timepoint(hours, minutes, seconds);
  }

  _add(other) {
    let tis = (this.hours * 60 + this.minutes) * 60 + this.seconds;
    let otis = (other.hours * 60 + other.minutes) * 60 + other.seconds;
    let res = tis + otis;
    let seconds = res % 60;
    res = Math.abs(Math.floor(res / 60));
    let minutes = res % 60;
    let hours = Math.abs(Math.floor(res / 60));
    return new Timepoint(hours, minutes, seconds);
  }

  static _addHelper(lhs, rhs) {
    if (lhs._equals(rhs)) return new Timepoint(0, 0, 0);
    else if (lhs._lessThan(rhs)) {
      return rhs._subtract(lhs);
    } else if (lhs._greaterThan(rhs)) {
      let res = lhs._subtract(rhs);
      res.overflow = true;
      return res;
    }
  }

  lessThan(other) {
    if (this.overflow && other.overflow) return _greaterthan(other);
    else if (this.overflow && !other.overflow) return true;
    else if (!this.overflow && other.overflow) return false;
    else return this._lessthan(other);
  }

  greaterThan(other) {
    if (this.overflow && other.overflow) return this._lessthan(other);
    else if (this.overflow && !other.overflow) return false;
    else if (!this.overflow && other.overflow) return true;
    else return this._greaterthan(other);
  }

  equals(other) {
    if (this._equals(Timepoint.zeroTime) && other._equals(Timepoint.zeroTime))
      return true; //short-circuit -0:00:00 == 0:00:00
    return this.overflow === other.overflow ? this._equals(other) : false;
  }

  subtract(other) {
    if (this.overflow && other.overflow) {
      if (this._equals(other)) return new Timepoint(0, 0, 0);
      let res = Timepoint._addHelper(this, other);
      res.overflow = true;
      return res;
    } else if (this.overflow && !other.overflow) {
      let res = this._add(other);
      res.overflow = true;
      return res;
    } else if (!this.overflow && other.overflow) return this._add(other);
    else {
      if (this._lessThan(other)) {
        let res = other._subtract(this);
        res.overflow = true;
        return res;
      } else return this._subtract(other);
    }
  }

  add(other) {
    if (this.overflow && other.overflow) {
      let res = this._add(other);
      res.overflow = true;
      return res;
    } else if (this.overflow && !other.overflow)
      return Timepoint._addHelper(this, other);
    else if (!this.overflow && other.overflow)
      return Timepoint._addHelper(other, this);
    else return this._add(other);
  }

  static now() {
    let now = new Date();
    return new Timepoint(now.getHours(), now.getMinutes(), now.getSeconds());
  }

  static zeroTime = new Timepoint(0, 0, 0);
  static maxTime = new Timepoint(23, 59, 59);
  static minTime = new Timepoint(23, 59, 59, true);
  static idTime = new Timepoint(0, 0, 1);
}

class Timer {
  constructor() {
    this.timepoint = new Timepoint(0, 0, 0);
    this.runningTimepoint = new Timepoint(0, 0, 0);
    this.isCountdown = false;
    this.overflowAllowed = false;
    this.running = false;
  }

  unpause() {
    this.running = true;
    return this;
  }

  pause() {
    this.running = false;
    return this;
  }

  start() {
    this.restart();
    return this.unpause();
  }

  stop() {
    this.pause();
    return this.restart();
  }

  restart() {
    Object.assign(this.runningTimepoint, this.timepoint);
    return this;
  }

  isAtTimepoint(timepoint) {
    if (this.isCountdown) {
      if (timepoint.overflow) return this.runningTimepoint._equals(timepoint);
      else {
        let ac = this.timepoint.subtract(this.runningTimepoint);
        return ac._equals(timepoint);
      }
    } else return this.runningTimepoint._equals(timepoint);
  }

  increment(timepoint = Timepoint.idTime) {
    this.runningTimepoint = this.runningTimepoint.add(timepoint);
    return this;
  }

  decrement(timepoint = Timepoint.idTime) {
    this.runningTimepoint = this.runningTimepoint.subtract(timepoint);
    return this;
  }

  update() {
    if (this.running) {
      if (
        this.runningTimepoint.equals(Timepoint.maxTime) ||
        this.runningTimepoint.equals(Timepoint.minTime)
      ) {
        this.stop();
      }
      if (this.isCountdown) this.decrement();
      else this.increment();
    }
    return this;
  }

  stringify() {
    return Timepoint.stringify(this.runningTimepoint);
  }
}

const t1 = new Timepoint(1, 2, 1);
const t2 = new Timepoint(1, 2, 1, true);
const t3 = new Timepoint(1, 3, 1);
const t4 = new Timepoint(1, 3, 1, true);

/*console.log(Timepoint.stringify(t1.add(t1))); //2:04:02
console.log(Timepoint.stringify(t1.add(t2))); //0:00:00
console.log(Timepoint.stringify(t2.add(t1))); //0:00:00
console.log(Timepoint.stringify(t2.add(t2))); //-2:04:02
console.log(Timepoint.stringify(t3.add(t2))); //0:01:00
console.log(Timepoint.stringify(t2.add(t3))); //0:01:00
console.log(Timepoint.stringify(t4.add(t1))); //-0:01:00
console.log(Timepoint.stringify(t1.add(t4))); //-0:01:00
console.log(Timepoint.stringify(t1.subtract(t1))); //0:00:00
console.log(Timepoint.stringify(t1.subtract(t2))); //2:04:02
console.log(Timepoint.stringify(t2.subtract(t1))); //-2:04:02
console.log(Timepoint.stringify(t2.subtract(t2))); //0:00:00
console.log(Timepoint.stringify(t3.subtract(t2))); //2:05:02
console.log(Timepoint.stringify(t2.subtract(t3))); //-2:05:02
console.log(Timepoint.stringify(t2.subtract(t4))); //-0:01:00
console.log(Timepoint.stringify(t2.subtract(t4))); //-0:01:00*/
let timer = new Timer();
timer.timepoint = new Timepoint(0,0,1);
timer.isCountdown = true;
timer.start();
console.log(Timepoint.stringify(timer.update().runningTimepoint));
console.log(Timepoint.stringify(timer.update().runningTimepoint));

module.exports = {
  Timer: Timer,
  Timepoint: Timepoint,
};
