import ClockSource from "../common/ClockSource";
import InternalClockSource from "./ClockSourceInternal";
import { Runsheet } from "../common/Runsheet";
import { TrackingShow } from "../common/Tracking";
import initProperties from "../common/Init";
import Goto from "./command/Goto";
import LoadRunsheet from "./command/LoadRunsheet";
import { addThisTickHandler, eventhandler } from "./Eventhandler";

export const ControlHandler: {
  clocks: Map<string, ClockSource>;
  loaded: Runsheet | undefined;
  tracking: Map<string, TrackingShow>;
} = {
  clocks: new Map<string, ClockSource>([["internal", InternalClockSource]]),
  loaded: undefined,
  tracking: new Map<string, TrackingShow>(),
};

export function init() {
  initProperties();
  Goto;
  LoadRunsheet;
  addThisTickHandler(() => {
    eventhandler.emit("clock");
  });
}

const runsheetDir = "storage/runsheets";
const templateDir = "storage/templates";
const knownRunsheets: Map<string, string> = new Map<string, string>();
const knownTemplates: Map<string, string> = new Map<string, string>();

export function RunsheetList(): string[] {
  return Array.from(knownRunsheets.keys());
}

export function TemplateList(): string[] {
  return Array.from(knownTemplates.keys());
}
