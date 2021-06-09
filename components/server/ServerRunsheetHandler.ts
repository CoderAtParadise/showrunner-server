import RunsheetHandler from "../common/RunsheetHandler";
import Runsheet, { JSON as RJSON } from "../common/Runsheet";
import TrackingShow, { JSON as TJSON } from "../common/TrackingShow";
import ClockSource from "../common/ClockSource";
import Show from "../common/Show";
import Storage from "../common/Storage";
import EventHandler from "./EventHandler";
import { SaveRunsheet } from "./FileManager";

interface ServerRunsheetData {
  runsheet: Runsheet | undefined;
  tracking: Map<string, TrackingShow>;
  clocks: Map<string, ClockSource>;
}

const ServerRunsheet: RunsheetHandler & ServerRunsheetData = {
  runsheet: undefined,
  tracking: new Map<string, TrackingShow>(),
  clocks: new Map<string, ClockSource>(),
  setRunsheet: (runsheet: Runsheet): void => {
    ServerRunsheet.runsheet = runsheet;
    ServerRunsheet.tracking.clear();
  },
  hasLoadedRunsheet: (): boolean => {
    return ServerRunsheet.runsheet !== undefined;
  },
  getClock: (id: string): ClockSource | undefined => {
    return ServerRunsheet.clocks.get(id);
  },
  addClock: (clock:ClockSource): void => {
    ServerRunsheet.clocks.set(clock.id,clock);
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
  getTrackingShow: (id: string): TrackingShow | undefined => {
    return ServerRunsheet.tracking.get(id);
  },
  addTrackingShow: (trackingShow: TrackingShow): void => {
    ServerRunsheet.tracking.set(trackingShow.id, trackingShow);
  },
  deleteTrackingSHow: (id: string): void => {
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
  if (ServerRunsheet.runsheet)
  {
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
