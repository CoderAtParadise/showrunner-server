import ICommand, { registerCommand } from "./ICommand";
import TrackingShow from "../../common/TrackingShow";
import { TimerState } from "../../common/Timer";
import { INVALID as INVALID_POINT, add } from "../../common/TimePoint";
import { getProperty, hasProperty, Type, Storage } from "../../common/Storage";
import {
  ParentProperty,
  INVALID as INVALID_PARENT,
} from "../../common/property/Parent";
import { TimerProperty } from "../../common/property/Timer";
import EventHandler from "../Eventhandler";
import RunsheetHandler from "../../common/RunsheetHandler";
import ServerRunsheet, { syncTracking } from "../ServerRunsheetHandler";

interface GotoData {
  show: string;
  tracking: string;
}

function isGotoData(obj: any): obj is GotoData {
  return obj.show !== undefined && obj.tracking !== undefined;
}

function startTracking(
  handler: RunsheetHandler,
  trackingShow: TrackingShow,
  id: string
) {
  if (handler.hasLoadedRunsheet()) {
    const tracker = trackingShow.trackers.get(id);
    const storage = handler.getStorage(id);
    const show = handler.getShow(trackingShow.id);
    if (tracker && storage && show) {
      if (
        hasProperty(storage, "timer") &&
        tracker.timer.state !== TimerState.RUNNING &&
        tracker.timer.state !== TimerState.OVERRUN
      ) {
        const settings = getProperty(storage, show, "timer") as TimerProperty;
        tracker.timer.start =
          handler.getClock("internal")?.clock() || INVALID_POINT;
        tracker.timer.end = add(tracker.timer.start, settings.value.duration);
        tracker.timer.state = TimerState.RUNNING;
        EventHandler.emit("direction:start", trackingShow.id, id);
      }
      const parent = getProperty(storage, show, "parent") as ParentProperty;
      if (parent) {
        startTracking(handler, trackingShow, parent.value);
      }
    }
  }
}

function endTracking(
  handler: RunsheetHandler,
  trackingShow: TrackingShow,
  id: string,
  next: string
) {
  if (handler.hasLoadedRunsheet()) {
    const tracker = trackingShow.trackers.get(id);
    const show = handler.getShow(trackingShow.id);
    const active = handler.getStorage(id);
    if (tracker) {
      tracker.timer.end =
        ServerRunsheet.getClock("internal")?.clock() || INVALID_POINT;
      tracker.timer.state = TimerState.STOPPED;
      trackingShow.active = "";
      EventHandler.emit("direction:end", trackingShow.id, id);
    }
    const nextStorage = handler.getStorage(next);
    if (active && show && nextStorage) {
      const parent = getProperty(active, show, "parent") as ParentProperty;
      const nextParent = getProperty(
        nextStorage,
        show,
        "parent"
      ) as ParentProperty;
      if (parent && nextParent) {
        if (parent.value !== nextParent.value)
          endTracking(handler, trackingShow, parent.value, nextParent.value);
      }
    }
  }
}

function getNext(handler: RunsheetHandler, trackingShow: TrackingShow): string {
  if (handler.hasLoadedRunsheet()) {
    const show = handler.getShow(trackingShow.id);
    const active = handler.getStorage(trackingShow.active);
    if (show && active) {
      const parent = getProperty(active, show, "parent") as ParentProperty;
      if (parent) {
        const next = getNextEnabled(
          handler,
          trackingShow,
          parent.value,
          trackingShow.active
        );
        if (next) return next.id;
      }
    }
  }
  return "";
}

function getNextEnabled(
  handler: RunsheetHandler,
  trackingShow: TrackingShow,
  id: string,
  after: string
): Storage<any> | undefined {
  if (ServerRunsheet.hasLoadedRunsheet()) {
    const show = ServerRunsheet.getShow(trackingShow.id);
    const storage = ServerRunsheet.getStorage(id);
    if (show && storage) {
      const children = getProperty(storage, show, "index_list");
      if (children) {
        const aindex = children.value.indexOf(after);
        const next = children.value.find((cid: string, index: number) => {
          const cstorage = ServerRunsheet.getStorage(cid);
          if (show && cstorage) {
            const disabled = getProperty(cstorage, show, "disabled");
            if (disabled) {
              if (
                index > aindex &&
                !disabled.value &&
                trackingShow.trackers.get(cid)
              )
                return cid;
            }
          }
        });
        if (next) {
          const ns = ServerRunsheet.getStorage(next);
          if (ns) {
            if (ns.type !== Type.SESSION && ns.type !== Type.BRACKET) return ns;
            else return getNextEnabled(ServerRunsheet, trackingShow, next, id);
          }
        } else {
          const parent = getProperty(storage, show, "parent") as ParentProperty;
          if (parent)
            return getNextEnabled(
              ServerRunsheet,
              trackingShow,
              parent.value,
              id
            );
        }
      }
    }
  }
  return undefined;
}

function directionNext(
  trackingShow: TrackingShow,
  activeId: string,
  id: string
) {
  const show = ServerRunsheet.getShow(trackingShow.id);
  const storage = ServerRunsheet.getStorage(id);
  const active = ServerRunsheet.getStorage(activeId);
  if (show && storage) {
    const parent = getProperty(storage, show, "parent") as ParentProperty;
    let activeParent: ParentProperty;
    if (active)
      activeParent = getProperty(active, show, "parent") as ParentProperty;
    else activeParent = INVALID_PARENT;
    if (parent && activeParent !== undefined) {
      if (parent.value !== activeParent.value)
        directionNext(trackingShow, activeParent.value, parent.value);
    }
  }
  EventHandler.emit("direction:next", trackingShow.id, id);
}

const GotoCommand: ICommand<GotoData> = {
  id: "goto",
  validate: (data: any) => {
    return isGotoData(data);
  },
  run: (data: GotoData) => {
    if (ServerRunsheet.hasLoadedRunsheet()) {
      const show = ServerRunsheet.getTrackingShow(data.show);
      if (show) {
        if (show.trackers.has(data.tracking)) {
          const storage = ServerRunsheet.getStorage(data.tracking);
          let id = data.tracking;
          if (storage) {
            if (
              storage.type === Type.SESSION ||
              storage.type === Type.BRACKET
            ) {
              const next = getNextEnabled(ServerRunsheet,show, data.tracking, "");
              if (next) id = next.id;
              else id = "";
            }
          }
          if (show.active === "") directionNext(show, "", id);
          endTracking(ServerRunsheet,show, show.active, id);
          startTracking(ServerRunsheet, show, id);
          show.active = id;
          show.next = getNext(ServerRunsheet,show);
          directionNext(show, show.active, show.next);
          syncTracking(show);
        }
      }
    }
  },
};

export default registerCommand(GotoCommand);
