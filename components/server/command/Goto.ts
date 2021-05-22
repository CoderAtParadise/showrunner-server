import ICommand, { registerCommand } from "./ICommand";
import { ControlHandler } from "../Control";
import { TrackingShow, TRACKINGSHOW_JSON } from "../../common/Tracking";
import { TimerState } from "../../common/Timer";
import { INVALID as INVALID_POINT, add } from "../../common/Time";
import { getProperty, hasProperty, Type, Storage } from "../../common/Storage";
import { ParentProperty } from "../../common/property/Parent";
import { TimerProperty } from "../../common/property/Timer";
import { eventhandler } from "../Eventhandler";
import { gatherChildren } from "../../common/Runsheet";
import Show from "../../common/Show";

interface GotoData {
  show: string;
  tracking: string;
}

function isGotoData(obj: any): obj is GotoData {
  return obj.show !== undefined && obj.tracking !== undefined;
}

function startTracking(trackingShow: TrackingShow, id: string) {
  if (ControlHandler.loaded) {
    const tracker = trackingShow.trackers.get(id);
    const storage = ControlHandler.loaded.defaults.get(id);
    const show = ControlHandler.loaded.shows.get(trackingShow.id);
    if (tracker && storage && show) {
      if (
        hasProperty(storage, "timer") &&
        tracker.timer.state !== TimerState.RUNNING &&
        tracker.timer.state !== TimerState.OVERRUN
      ) {
        const settings = getProperty(storage, show, "timer") as TimerProperty;
        tracker.timer.start =
          ControlHandler.clocks.get("internal")?.clock() || INVALID_POINT;
        tracker.timer.end = add(tracker.timer.start, settings.value.duration);
      }
      const parent = getProperty(storage, show, "parent") as ParentProperty;
      if (parent) {
        startTracking(trackingShow, parent.value.id);
      }
    }
  }
}

function endTracking(trackingShow: TrackingShow, id: string, next: string) {
  if (ControlHandler.loaded) {
    const tracker = trackingShow.trackers.get(id);
    const show = ControlHandler.loaded.shows.get(trackingShow.id);
    const active = ControlHandler.loaded.defaults.get(id);
    if (tracker) {
      tracker.timer.end =
        ControlHandler.clocks.get("internal")?.clock() || INVALID_POINT;
      tracker.timer.state = TimerState.STOPPED;
      trackingShow.active = "";
    }
    const nextStorage = ControlHandler.loaded.defaults.get(next);
    if (active && show && nextStorage) {
      const parent = getProperty(active, show, "parent") as ParentProperty;
      const nextParent = getProperty(
        nextStorage,
        show,
        "parent"
      ) as ParentProperty;
      if (parent && nextParent) {
        if (parent.value.id !== nextParent.value.id)
          endTracking(trackingShow, parent.value.id, nextParent.value.id);
      }
    }
  }
}

function getNext(trackingShow: TrackingShow): string {
  if (ControlHandler.loaded) {
    const show = ControlHandler.loaded.shows.get(trackingShow.id);
    const active = ControlHandler.loaded.defaults.get(trackingShow.active);
    if (show && active) {
      const parent = getProperty(active, show, "parent") as ParentProperty;
      if (parent) {
        const next = getNextEnabled(show, parent.value.id, trackingShow.active);
        if (next) return next.id;
      }
    }
  }
  return "";
}

function getNextEnabled(
  show: Show,
  id: string,
  after: string
): Storage<any> | undefined {
  if (ControlHandler.loaded) {
    const children = gatherChildren(ControlHandler.loaded, show.id, id);
    const aindex = children.indexOf(after);
    const next = children.find((cid: string, index: number) => {
      const storage = ControlHandler.loaded?.defaults.get(cid);
      if (storage) {
        if (hasProperty(storage, "disabled")) {
          if (index > aindex && !getProperty(storage, show, "disabled")?.value)
            return cid;
        }
      }
    });
    if (next) {
      const ns = ControlHandler.loaded.defaults.get(next);
      if (ns) {
        if (ns.type !== Type.SESSION && ns.type !== Type.BRACKET) return ns;
        else return getNextEnabled(show, next, id);
      }
    } else {
      const storage = ControlHandler.loaded.defaults.get(id);
      if (storage) {
        const parent = getProperty(storage, show, "parent") as ParentProperty;
        if (parent) {
          return getNextEnabled(show, parent.value.id, id);
        }
      }
    }
  }
  return undefined;
}

const GotoCommand: ICommand<GotoData> = {
  id: "goto",
  validate: (data: any) => {
    return isGotoData(data);
  },
  run: (data: GotoData) => {
    if (ControlHandler.loaded) {
      const show: TrackingShow | undefined = ControlHandler.tracking.get(
        data.show
      );
      if (show) {
        if (show.trackers.has(data.tracking)) {
          const storage = ControlHandler.loaded.defaults.get(data.tracking);
          let id = data.tracking;
          if (storage) {
            if (
              storage.type === Type.SESSION ||
              storage.type === Type.BRACKET
            ) {
              const ds = ControlHandler.loaded.shows.get(show.id);
              if (ds) {
                const next = getNextEnabled(ds, data.tracking, "");
                if (next) id = next.id;
              }
            }
          }
          endTracking(show, show.active, id);
          startTracking(show, id);
          show.active = id;
          show.next = getNext(show);
          eventhandler.emit(
            "sync",
            "tracking",
            TRACKINGSHOW_JSON.serialize(show)
          );
        }
      }
    }
  },
};

export default registerCommand(GotoCommand);
