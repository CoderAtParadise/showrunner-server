import RunsheetHandler from "../common/RunsheetHandler";
import Runsheet, { JSON as RJSON } from "../common/Runsheet";
import TrackingShow, { JSON as TJSON } from "../common/TrackingShow";
import ClockSource from "../common/ClockSource";
import Show from "../common/Show";
import Storage from "../common/Storage";
import EventHandler from "./Scheduler";

interface ServerRunsheetData {
  runsheet: Runsheet | undefined;
  tracking: Map<string, TrackingShow>;
  active: string;
  clocks: Map<string, ClockSource>;
  dirtyV: boolean;
}

const ServerRunsheet: RunsheetHandler & ServerRunsheetData = {
  runsheet: undefined,
  dirtyV: false,
  active: "",
  tracking: new Map<string, TrackingShow>(),
  clocks: new Map<string, ClockSource>(),
  setRunsheet: (runsheet: Runsheet): void => {
    ServerRunsheet.runsheet = runsheet;
    ServerRunsheet.tracking.clear();
  },
  dirty: (): boolean => {
    return ServerRunsheet.dirtyV;
  },
  markDirty: (): void => {
    ServerRunsheet.dirtyV = true;
  },
  hasLoadedRunsheet: (): boolean => {
    return ServerRunsheet.runsheet !== undefined;
  },
  getClock: (id: string): ClockSource | undefined => {
    return ServerRunsheet.clocks.get(id);
  },
  addClock: (clock: ClockSource): void => {
    ServerRunsheet.clocks.set(clock.id, clock);
  },
  getShow: (id: string): Show | undefined => {
    return ServerRunsheet.runsheet?.shows.get(id);
  },
  addShow: (show: Show): void => {
    ServerRunsheet.runsheet?.shows.set(show.id, show);
  },
  deleteShow: (id: string): void => {
    ServerRunsheet.runsheet?.shows.delete(id);
  },
  showList: (): string[] => {
    if (ServerRunsheet.runsheet)
      return Array.from(ServerRunsheet.runsheet.shows.keys());
    return [];
  },
  activeShow: (): string => {
    return ServerRunsheet.active;
  },
  setActiveShow: (id:string) : void => {
    ServerRunsheet.active = id;
  },
  getTrackingShow: (id: string): TrackingShow | undefined => {
    return ServerRunsheet.tracking.get(id);
  },
  addTrackingShow: (trackingShow: TrackingShow): void => {
    ServerRunsheet.tracking.set(trackingShow.id, trackingShow);
  },
  deleteTrackingShow: (id: string): void => {
    ServerRunsheet.tracking.delete(id);
  },
  getStorage: (id: string): Storage<any> | undefined => {
    return ServerRunsheet.runsheet?.defaults.get(id);
  },
  addStorage: (storage: Storage<any>): void => {
    ServerRunsheet.runsheet?.defaults.set(storage.id, storage);
  },
  deleteStorage: (id: string): void => {
    ServerRunsheet.runsheet?.defaults.delete(id);
  },
};

export function syncRunsheet(): void {
  if (ServerRunsheet.runsheet) {
    EventHandler.emit(
      "sync",
      "runsheet",
      RJSON.serialize(ServerRunsheet.runsheet)
    );
  }
}

export function syncTracking(show: TrackingShow): void {
  EventHandler.emit("sync", "tracking", TJSON.serialize(show));
}

export default ServerRunsheet;
