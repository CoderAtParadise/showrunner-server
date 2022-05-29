import { registerCommand } from "@coderatparadise/showrunner-common";
import { GetServerSettings } from "./ServerSettings";

export function init() {
    registerCommand(GetServerSettings);
}
