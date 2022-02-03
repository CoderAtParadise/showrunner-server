import { ShowManager, ShowHandler } from "@coderatparadise/showrunner-common";

export class ServerShowManager implements ShowManager {
    shows: Map<string, ShowHandler> = new Map<string, ShowHandler>();
}
