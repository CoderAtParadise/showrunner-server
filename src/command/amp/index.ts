import { registerCommand } from "@coderatparadise/showrunner-common";
import { ListChannels } from "./ListChannels";
import { ListVideos } from "./ListVideos";
import { RemoveChannel } from "./RemoveChannel";
import { RestartChannel } from "./RestartChannel";

export function init() {
    registerCommand(ListVideos);
    registerCommand(ListChannels);
    registerCommand(RemoveChannel);
    registerCommand(RestartChannel);
}
