import { Session } from "./session";
import { Item } from "./item";
import { TimerSettings, loadTimer } from "./timer";
import { eventhandler } from "./eventhandler";

export class Bracket {
  session?: Session;
  display: string;
  clock: TimerSettings;
  items: Item[] = [];
  activeIndex = 0;

  constructor(display: string, clock: TimerSettings) {
    this.display = display;
    this.clock = clock;
  }

  bracketSwitch() {
    loadTimer("bracket", this.clock);
    eventhandler.emit("switch:bracket");
  }

  addItem(item: Item) {
    this.addItemAtIndex(this.items.length, item);
  }

  addItemAtIndex(index: number, item: Item) {
    item.bracket = this;
    this.items.splice(index, 0, item);
  }

  deleteItem(index: number) {
    if (
      this.activeIndex === index &&
      this.activeIndex === this.items.length - 1
    )
      this.activeIndex--;
    this.items.splice(index, 1);
  }

  setActive(index: number) {
    this.activeIndex = index;
    this.items[this.activeIndex].itemSwitch();
  }

  isActive(item: Item) {
    return (
      this.session?.isActive(this) &&
      this.activeIndex === this.items.indexOf(item)
    );
  }
}
