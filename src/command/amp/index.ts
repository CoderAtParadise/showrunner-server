import { registerCommand } from "@coderatparadise/showrunner-common";
import { ListChannels } from "./ListChannels";
import { ListVideos } from "./ListVideos";

export function init() {
    registerCommand(ListVideos);
    registerCommand(ListChannels);
}
