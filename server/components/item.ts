import {
  TimerSettings,
  TimerSettingsJson,
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

  constructor(display: string, clock: TimerSettings, directions: Direction[]) {
    this.display = display;
    this.clock = clock;
    this.directions = directions;
  }

  addDirection(direction: Direction): void {
    direction.item = this;
    direction.shouldNotify();
    this.directions.push(direction);
  }

  runDirection(index: number) {
    this.directions[index].notify();
  }

  itemSwitch() {
    eventhandler.emit("switch:item");
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
