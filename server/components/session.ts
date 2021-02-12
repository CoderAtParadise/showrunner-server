import { type } from "os";
import { Bracket } from "./bracket";
import { eventhandler } from "./eventhandler";
import { Item } from "./item";
import { loadTimer, Timepoint, TimerSettings, TimerType } from "./timer";

export class Session {
  display: string;
  clock: TimerSettings;
  brackets: Bracket[] = [];
  activeBracket = 0;

  constructor(display: string, clock: TimerSettings) {
    this.display = display;
    this.clock = clock;
  }

  sessionSwitch() {
    loadTimer("session", this.clock);
    eventhandler.emit("switch:session");
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
      activeSession--;
    this.brackets.splice(index, 1);
  }

  setActive(index: number) {
    this.activeBracket = index;
    this.brackets[this.activeBracket].bracketSwitch();
  }

  isActive(bracket: Bracket) {
    return this.activeBracket === this.brackets.indexOf(bracket);
  }
}

export const sessions: Session[] = [];
export let activeSession = 0;

export const addSession = (session: Session) => {
  addSessionAtIndex(sessions.length, session);
};

export const addSessionAtIndex = (index: number, session: Session) => {
  sessions.splice(index, 0, session);
};

export const setActiveSession = (index: number) => {
  activeSession = index;
  sessions[activeSession].sessionSwitch();
};

export const deleteSession = (index: number) => {
  if (activeSession === index && activeSession === sessions.length - 1)
    activeSession--;
  sessions.splice(index, 1);
};

const ses = new Session(
  "service",
  new TimerSettings({
    type: TimerType.COUNTDOWN,
    time: new Timepoint(1, 20, 0),
  })
);
addSession(ses);
const bra = new Bracket(
  "Pre-Roll",
  new TimerSettings({ type: TimerType.COUNTDOWN, time: new Timepoint(0, 5, 0) })
);
ses.addBracket(bra);
const item = new Item(
  "Jan PreRoll Video",
  new TimerSettings({
    type: TimerType.COUNTDOWN,
    time: new Timepoint(0, 4, 30),
  })
);
bra.addItem(item);
