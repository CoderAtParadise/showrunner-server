import { registerCommand } from "@coderatparadise/showrunner-common";
import { init as ClockInit } from "./clock";
import { init as AmpInit } from "./amp";

export function init() {
    ClockInit();
    AmpInit();
}
