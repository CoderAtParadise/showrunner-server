import {
  loadTimer,
  TimerSettings,
  TimerSettingsJson,
  getTimer,
  TimerType,
} from "./timer";
import { Direction, DirectionJson } from "./direction";
import { eventhandler, schedule } from "./eventhandler";
import { Bracket } from "./bracket";
import IJson from "./IJson";

export class Item {
  bracket?: Bracket;
  display: string;
  clock: TimerSettings;
  directions: Direction[];
  disabled: boolean = false;

  constructor(display: string, clock: TimerSettings, directions: Direction[]) {
    this.display = display;
    this.clock = clock;
    this.directions = directions;
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
    schedule(() => {
      getTimer("item")?.start();
    });
  }

  isActive() {
    return this.bracket?.isActive(this);
  }
}

export const ItemJson: IJson<Item> = {
  serialize(value: Item): object {
    const obj: { display: string; clock: {}; directions: object[] } = {
      display: value.display,
      clock: TimerSettingsJson.serialize(value.clock),
      directions: [],
    };
    value.directions.forEach((value: Direction) =>
      obj.directions.push(DirectionJson.serialize(value))
    );
    return obj;
  },

  deserialize(json: object): Item {
    const value = json as { display: string; clock: {}; directions: object[] };
    const directions: Direction[] = [];
    value.directions.forEach((json: object) =>
      directions.push(DirectionJson.deserialize(json))
    );
    return new Item(
      value.display,
      TimerSettingsJson.deserialize(value.clock),
      directions
    );
  },
};
