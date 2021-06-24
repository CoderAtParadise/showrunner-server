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
import EventHandler from "../Scheduler";
import RunsheetHandler from "../../common/RunsheetHandler";
import ServerRunsheetHandler from "../ServerRunsheetHandler";

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
  const tracker = trackingShow.trackers.get(id);
  const show = handler.getShow(trackingShow.id);
  const active = handler.getStorage(id);
  if (tracker) {
    tracker.timer.end = handler.getClock("internal")?.clock() || INVALID_POINT;
    tracker.timer.state = TimerState.STOPPED;
    trackingShow.active = "";
    EventHandler.emit("direction:end", trackingShow.id, id);
  }
  if (active && show && next === "") {
    const parent = getProperty(active, show, "parent") as ParentProperty;
    if (parent) endTracking(handler, trackingShow, parent.value, "");
  } else {
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

export function getNext(handler: RunsheetHandler, trackingShow: TrackingShow): string {
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
  const show = handler.getShow(trackingShow.id);
  const storage = handler.getStorage(id);
  if (show && storage) {
    const children = getProperty(storage, show, "index_list");
    if (children) {
      const aindex = children.value.indexOf(after);
      const next = children.value.find((cid: string, index: number) => {
        const cstorage = handler.getStorage(cid);
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
        const ns = handler.getStorage(next);
        if (ns) {
          if (ns.type !== Type.SESSION && ns.type !== Type.BRACKET) return ns;
          else return getNextEnabled(handler, trackingShow, next, id);
        }
      } else {
        const parent = getProperty(storage, show, "parent") as ParentProperty;
        if (parent)
          return getNextEnabled(handler, trackingShow, parent.value, id);
      }
    }
  }
  return undefined;
}

function directionNext(
  handler: RunsheetHandler,
  trackingShow: TrackingShow,
  activeId: string,
  id: string
) {
  const show = handler.getShow(trackingShow.id);
  const storage = handler.getStorage(id);
  const active = handler.getStorage(activeId);
  if (show && storage) {
    const parent = getProperty(storage, show, "parent") as ParentProperty;
    let activeParent: ParentProperty;
    if (active)
      activeParent = getProperty(active, show, "parent") as ParentProperty;
    else activeParent = INVALID_PARENT;
    if (parent && activeParent !== undefined) {
      if (parent.value !== activeParent.value)
        directionNext(handler, trackingShow, activeParent.value, parent.value);
    }
  }
  EventHandler.emit("direction:next", trackingShow.id, id);
}

const GotoCommand: ICommand<GotoData> = {
  id: "goto",
  validate: (data: any) => {
    return isGotoData(data);
  },
  run: (handler: ServerRunsheetHandler, data: GotoData) => {
    const show = handler.getTrackingShow(data.show);
    if (show) {
      if (handler.activeShow() !== data.show) handler.setActiveShow(data.show);
      if (data.tracking === "") {
        endTracking(handler, show, show.active, "");
        handler.setActiveShow("");
        handler.syncTracking(show);
      } else {
        if (show.trackers.has(data.tracking)) {
          const storage = handler.getStorage(data.tracking);
          let id = data.tracking;
          if (storage) {
            if (
              storage.type === Type.SESSION ||
              storage.type === Type.BRACKET
            ) {
              const next = getNextEnabled(handler, show, data.tracking, "");
              if (next) id = next.id;
              else id = "";
            }
          }
          if (show.active === "") directionNext(handler, show, "", id);
          endTracking(handler, show, show.active, id);
          startTracking(handler, show, id);
          show.active = id;
          show.next = getNext(handler, show);
          directionNext(handler, show, show.active, show.next);
          handler.syncTracking(show);
        }
      }
    }
  },
};

export default registerCommand(GotoCommand);
