namespace Time {
  export enum Format {
    NONE = "",
    RELSTART = "+",
    RELEND = "-",
  }

  export interface Point {
    readonly hours: number;
    readonly minutes: number;
    readonly seconds: number;
  }

  export interface Relative extends Point {
    format: Format;
  }

  export const now = (): Point => {
    const now = new Date();
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    };
  };

  export const add = (lhs: Point, rhs: Point): Point => {
    if (lhs === INVALID || rhs === INVALID) return INVALID;
    const tis = (lhs.hours * 60 + lhs.minutes) * 60 + lhs.seconds;
    const otis = (rhs.hours * 60 + rhs.minutes) * 60 + rhs.seconds;
    let res = Math.abs(tis + otis);
    const seconds = res % 60;
    res = Math.floor(res / 60);
    const minutes = res % 60;
    const hours = Math.floor(res / 60);
    return { hours: hours, minutes: minutes, seconds: seconds };
  };

  export const subtract = (lhs: Point, rhs: Point): Point => {
    if (lhs === INVALID || rhs === INVALID) return INVALID;
    const tis = (lhs.hours * 60 + lhs.minutes) * 60 + lhs.seconds;
    const otis = (rhs.hours * 60 + rhs.minutes) * 60 + rhs.seconds;
    let res = Math.abs(tis - otis);
    const seconds = res % 60;
    res = Math.floor(res / 60);
    const minutes = res % 60;
    const hours = Math.floor(res / 60);
    return { hours: hours, minutes: minutes, seconds: seconds };
  };

  export const equals = (lhs: Point, rhs: Point): boolean => {
    return (
      lhs.hours === rhs.hours &&
      lhs.minutes === rhs.minutes &&
      lhs.seconds === rhs.seconds
    );
  };

  export const greaterThan = (lhs: Point, rhs: Point): boolean => {
    if (lhs === INVALID || rhs === INVALID) return false;
    if (lhs.hours > rhs.hours) return true;
    if (lhs.hours === rhs.hours) {
      if (lhs.minutes > rhs.minutes) return true;
      if (lhs.minutes === rhs.minutes)
        if (lhs.seconds > rhs.seconds) return true;
    }
    return false;
  };

  export const lessThan = (lhs: Point, rhs: Point): boolean => {
    if (lhs === INVALID || rhs === INVALID) return false;
    if (lhs.hours < rhs.hours) return true;
    if (lhs.hours === rhs.hours) {
      if (lhs.minutes < rhs.minutes) return true;
      if (lhs.minutes === rhs.minutes)
        if (lhs.seconds < rhs.seconds) return true;
    }
    return false;
  };

  const zeroPad = (num: number, places: number): string => {
    return String(num).padStart(places, "0");
  };

  export const stringify = (point: Point | Relative): string => {
    if (equals(point, INVALID)) return "--:--:--";
    if ("format" in point) {
      const p = point as Relative;
      return `${p.format}${zeroPad(p.hours, 2)}:${zeroPad(
        p.minutes,
        2
      )}:${zeroPad(p.seconds, 2)}`;
    }
    return `${zeroPad(point.hours, 2)}:${zeroPad(point.minutes, 2)}:${zeroPad(
      point.seconds,
      2
    )}`;
  };

  export const parse = (str: string): Time.Point | Time.Relative => {
    if (str === "--:--:--") return INVALID;
    if (str.charAt(0) === Format.RELSTART || str.charAt(0) === Format.RELEND) {
      const format: Format = str.charAt(0) as Format;
      str = str.slice(0);
      const v: string[] = str.split(":");
      return {
        hours: Number.parseInt(v[0]),
        minutes: Number.parseInt(v[1]),
        seconds: Number.parseInt(v[2]),
        format: format,
      };
    } else {
      const v: string[] = str.split(":");
      return {
        hours: Number.parseInt(v[0]),
        minutes: Number.parseInt(v[1]),
        seconds: Number.parseInt(v[2]),
      };
    }
  };

  export const ZEROTIME: Point = { hours: 0, minutes: 0, seconds: 0 };
  export const INVALID: Point = { hours: -1, minutes: -1, seconds: -1 };
}

export default Time;
