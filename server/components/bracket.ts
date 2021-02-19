import { Session } from "./session";
import { Item, ItemJson } from "./item";
import { TimerSettings, loadTimer, getTimer, TimerSettingsJson, Timepoint } from "./timer";
import { eventhandler, schedule } from "./eventhandler";
import IJson from "./IJson";

export class Bracket {
  session?: Session;
  display: string;
  clock: TimerSettings;
  items: Item[];

  constructor(display: string, clock: TimerSettings, items: Item[]) {
    this.display = display;
    this.clock = clock;
    this.items = items;
  }

  bracketSwitch() {
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
    this.items.splice(index, 1);
  }

  getItem(index:number): Item {
    return this.items[index];
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
