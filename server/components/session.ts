import { type } from "os";
import { Bracket, BracketJson } from "./bracket";
import { eventhandler, schedule } from "./eventhandler";
import {
  getTimer,
  loadTimer,
  Timepoint,
  TimerSettings,
  TimerSettingsJson,
} from "./timer";
import IJson from "./IJson";

export class Session {
  display: string;
  startTimes: Timepoint[];
  clock: TimerSettings;
  brackets: Bracket[];
  activeBracket: number = 0;

  constructor(
    display: string,
    startTime: Timepoint[],
    clock: TimerSettings,
    brackets: Bracket[]
  ) {
    this.display = display;
    this.clock = clock;
    this.startTimes = startTime;
    this.brackets = brackets;
  }

  sessionSwitch() {
    loadTimer("session", this.clock);
    eventhandler.emit("switch:session");
    schedule(() => {
      getTimer("session")?.start();
    });
  }

  addBracket(bracket: Bracket) {
    this.addBracketAtIndex(this.brackets.length, bracket);
  }

  addBracketAtIndex(index: number, bracket: Bracket) {
    bracket.session = this;
    this.brackets.splice(index, 0, bracket);
  }

  deleteBracket(index: number) {
    if (
      this.activeBracket === index &&
      this.activeBracket === this.brackets.length - 1
    )
      this.activeBracket--;
    this.brackets.splice(index, 1);
  }

  setActive(index: number, restart: boolean) {
    if (this.activeBracket !== index || restart) {
      this.activeBracket = index;
      this.brackets[this.activeBracket].bracketSwitch();
    }
  }

  isActive(bracket: Bracket) {
    return this.activeBracket === this.brackets.indexOf(bracket);
  }
}

export const SessionJson: IJson<Session> = {
  serialize(value: Session): object {
    const obj: {
      display: string;
      startTimes: string[];
      clock: {};
      brackets: object[];
    } = {
      display: value.display,
      startTimes: [],
      clock: TimerSettingsJson.serialize(value.clock),
      brackets: [],
    };
    value.startTimes.forEach((value: Timepoint) =>
      obj.startTimes.push(value.toString())
    );
    value.brackets.forEach((value: Bracket) =>
      obj.brackets.push(BracketJson.serialize(value))
    );
    return obj;
  },

  deserialize(json: object): Session {
    const value = json as {
      display: string;
      startTimes: string[];
      clock: {};
      brackets: object[];
    };
    const brackets: Bracket[] = [];
    const startTimes: Timepoint[] = [];
    value.startTimes.forEach((json: string) =>
      startTimes.push(Timepoint.parse(json) || Timepoint.INVALID.copy())
    );
    value.brackets.forEach((json: object) =>
      brackets.push(BracketJson.deserialize(json))
    );
    return new Session(
      value.display,
      startTimes,
      TimerSettingsJson.deserialize(value.clock),
      brackets
    );
  },
};
