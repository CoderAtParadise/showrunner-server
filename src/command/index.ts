import { init as ClockInit } from "./clock";
import { init as AmpInit } from "./amp";
import { init as SystemInit } from "./system";

export function init() {
    ClockInit();
    AmpInit();
    SystemInit();
}
