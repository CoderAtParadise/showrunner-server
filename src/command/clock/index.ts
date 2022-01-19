import { init as CreateInit } from "./Create";
import { init as PlayInit } from "./Play";
import { init as StopInit } from "./Stop";
import { init as PauseInit } from "./Pause";
import { init as ResetInit } from "./Reset";

export function init() {
    CreateInit();
    PlayInit();
    StopInit();
    PauseInit();
    ResetInit();
}
