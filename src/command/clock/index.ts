import { CreateCommand } from "./Create";
import { PlayCommand } from "./Play";
import { StopCommand } from "./Stop";
import { PauseCommand } from "./Pause";
import { ResetCommand } from "./Reset";
import { EditCommand } from "./Edit";
import { registerCommand } from "@coderatparadise/showrunner-common";

export function init() {
    registerCommand(CreateCommand);
    registerCommand(PlayCommand);
    registerCommand(StopCommand);
    registerCommand(PauseCommand);
    registerCommand(ResetCommand);
    registerCommand(EditCommand);
}
