import { Session } from "./session";
import { Item, ItemJson } from "./item";
import { TimerSettings, loadTimer, getTimer, TimerSettingsJson } from "./timer";
import { eventhandler, schedule } from "./eventhandler";
import IJson from "./IJson";

export class Bracket {
  session?: Session;
  display: string;
  clock: TimerSettings;
  items: Item[];
  activeIndex = 0;

  constructor(display: string, clock: TimerSettings, items: Item[]) {
    this.display = display;
    this.clock = clock;
    this.items = items;
  }

  bracketSwitch() {
    loadTimer("bracket", this.clock);
    eventhandler.emit("switch:bracket");
    schedule(() => {
      getTimer("bracket")?.start();
    });
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

export const BracketJson: IJson<Bracket> = {
  serialize(value: Bracket): object {
    const obj: { display: string; clock: {}; items: object[] } = {
      display: value.display,
      clock: TimerSettingsJson.serialize(value.clock),
      items: [],
    };
    value.items.forEach((value: Item) =>
      obj.items.push(ItemJson.serialize(value))
    );
    return obj;
  },
  deserialize(json: object): Bracket {
    const value = json as { display: string; clock: {}; items: object[] };
    const items: Item[] = [];
    value.items.forEach((json: object) =>
      items.push(ItemJson.deserialize(json))
    );
    return new Bracket(
      value.display,
      TimerSettingsJson.deserialize(value.clock),
      items
    );
  },
};
