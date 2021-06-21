import RunsheetHandler from "../common/RunsheetHandler";
import Runsheet, { JSON as RJSON } from "../common/Runsheet";
import TrackingShow, {
  buildTrackingShow,
  JSON as TJSON,
} from "../common/TrackingShow";
import ClockSource from "../common/ClockSource";
import Show from "../common/Show";
import Storage from "../common/Storage";
import EventHandler from "./Scheduler";
import InternalClockSource from "./ClockSourceInternal";
import { ServerManager } from "./ServerInit";
import { SaveRunsheet } from "./FileManager";

export interface ServerRunsheetHandler extends RunsheetHandler {
  syncRunsheet: () => void;
  syncActive: () => void;
  syncTracking: (tshow: TrackingShow) => void;
  syncAllTracking: () => void;
  dirty: () => boolean;
  save: () => void;
  markDirty: (dirty: boolean) => void;
}

export class ServerRunsheet implements ServerRunsheetHandler {
  runsheet;
  dirtyV = false;
  active = "";
  tracking = new Map<string, TrackingShow>();

  constructor(runsheet: Runsheet) {
    this.runsheet = runsheet;
    this.runsheet.shows.forEach((value: Show) =>
      this.addTrackingShow(buildTrackingShow(value))
    );
  }

  syncRunsheet(): void {
    EventHandler.emit(
      "sync",
      "runsheet",
      this.runsheet.id,
      RJSON.serialize(this.runsheet)
    );
  }

  syncActive(): void {
    EventHandler.emit("sync", "show", this.runsheet.id, {active:this.activeShow()});
  }

  syncTracking(tshow: TrackingShow) {
    EventHandler.emit(
      "sync",
      "tracking",
      this.runsheet.id,
      TJSON.serialize(tshow)
    );
  }

  syncAllTracking() {
    this.tracking.forEach((value: TrackingShow) => {
      this.syncTracking(value);
    });
  }

  dirty(): boolean {
    return this.dirtyV;
  }

  markDirty(dirty: boolean): void {
    this.dirtyV = dirty;
  }

  save() {
    SaveRunsheet(this.runsheet.id, this.runsheet);
  }

  hasLoadedRunsheet(): boolean {
    return true;
  }

  getClock(id: string): ClockSource | undefined {
    return ServerManager.clocks.get(id);
  }

  addClock(clock: ClockSource): void {
    ServerManager.clocks.set(clock.id, clock);
  }

  getShow(id: string): Show | undefined {
    return this.runsheet.shows.get(id);
  }

  addShow(show: Show): void {
    this.runsheet.shows.set(show.id, show);
  }

  deleteShow(id: string): boolean {
    return this.runsheet.shows.delete(id);
  }

  showList(): string[] {
    return Array.from(this.runsheet.shows.keys());
  }

  activeShow(): string {
    return this.active;
  }

  setActiveShow(id: string): void {
    this.active = id;
    this.syncActive();
  }

  getTrackingShow(id: string): TrackingShow | undefined {
    return this.tracking.get(id);
  }

  addTrackingShow(tshow: TrackingShow): void {
    this.tracking.set(tshow.id, tshow);
  }

  deleteTrackingShow(id: string): boolean {
    return this.tracking.delete(id);
  }

  getStorage(id: string): Storage<any> | undefined {
    return this.runsheet.defaults.get(id);
  }

  addStorage(storage: Storage<any>): void {
    this.runsheet.defaults.set(storage.id, storage);
  }

  deleteStorage(id: string): boolean {
    return this.runsheet.defaults.delete(id);
  }
}

export function syncTracking(show: TrackingShow): void {
  EventHandler.emit("sync", "tracking", TJSON.serialize(show));
}

export default ServerRunsheetHandler;
