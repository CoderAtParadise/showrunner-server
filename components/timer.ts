import Time from "./time";
import IJson from "./IJson"

namespace Timer {
  export enum Behaviour {
    STOP = "stop",
    HIDE = "hide",
    OVERRUN = "overrun",
  }

  export enum Display {
    COUNTDOWN = "countdown",
    ELAPSED = "elapsed",
  }

  export interface Settings {
    duration: Time.Point;
    behaviour: Behaviour;
    display: Display;
    show: boolean;
  }

  export interface Tracking {
    start: Time.Point;
    end: Time.Point;
    show:boolean;
    overrun?: boolean;
  }

  interface JFormat {
    display: string;
    behaviour: string;
    duration: string;
    show: boolean;
  }

  export const JSON: IJson<Settings> = {
    serialize(value: Settings): object {
      const obj: JFormat = {
        display: value.display as string,
        behaviour: value.behaviour as string,
        duration: Time.stringify(value.duration),
        show: value.show,
      };
      return obj;
    },
  
    deserialize(json: object): Settings {
      const value = json as JFormat;
      return {
        display: value.display as Display,
        behaviour: value.behaviour as Behaviour,
        duration: Time.parse(value.duration),
        show: value.show,
      };
    },
  }

  export const current = (tracking: Tracking): Time.Point => {
    if(Time.greaterThan(Time.now(),tracking.end)) {
        tracking.overrun = true;
        return Time.subtract(Time.now(),tracking.start);
    }
    return Time.subtract(tracking.end, Time.now());
  };

  export const isAt = (tracking: Tracking, time: Time.Point): boolean => {
    return Time.equals(current(tracking), time);
  };
}

export default Timer;
