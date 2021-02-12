import { loadTimer, TimerSettings, getTimer } from "./timer";
import { Direction } from "./direction";
import { eventhandler } from "./eventhandler";
import { Bracket } from "./bracket";

export class Item {
  bracket?: Bracket;
  display: string;
  clock: TimerSettings;
  directions: Direction[] = [];
  disabled = false;

  constructor(display: string, clock: TimerSettings) {
    this.display = display;
    this.clock = clock;
  }

  changeEnabledState() {
    this.disabled = !this.disabled;
  }

  addDirection(direction: Direction): void {
    direction.item = this;
    direction.shouldNotify(); //setup any listeners needed
    this.directions.push(direction);
  }

  runDirection(index: number) {
    this.directions[index].notify();
  }

  itemSwitch() {
    loadTimer("item", this.clock);
    eventhandler.emit("switch:item");
  }

  isActive() {
      return this.bracket?.isActive(this);
  }
}
