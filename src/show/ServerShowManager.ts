import { ShowManager, ShowHandler } from "@coderatparadise/showrunner-common";
import debug from "debug";
import { loadShowHandler, saveShowHandler } from "../util/FileHandler";

interface ShowLoadState {
    loaded: boolean;
    displayName: string;
    location: string;
    show?: ShowHandler;
}

// interface RunsheetLoadState {
//     loaded: boolean;
//     displayname: string;
//     location: string;
// }

export class ServerShowManager implements ShowManager {
    registerShow(show: ShowHandler): void {
        if (!this.shows.has(show.id)) {
            this.shows.set(show.id, {
                loaded: true,
                displayName: show.displayName,
                location: show.location,
                show: show
            });
        }
    }

    loadShow(id: string): void {
        if (this.shows.has(id)) {
            const LoadState = this.shows.get(id);
            if (!LoadState!.loaded) loadShowHandler(id, LoadState!.location);
        }
    }

    unload(id: string): void {
        if (this.shows.has(id)) {
            const LoadState = this.shows.get(id);
            if (LoadState!.loaded) {
                saveShowHandler(LoadState!.show!);
                LoadState!.show = undefined;
                LoadState!.loaded = false;
            }
        }
    }

    hasShow(id: string): boolean {
        return this.shows.has(id);
    }

    getShow(id: string): ShowHandler | undefined {
        if (this.shows.has(id)) {
            this.loadShow(id);
            const LoadState = this.shows.get(id);
            if (!LoadState!.loaded) {
                debug("showrunner:io")(`Failed To Load ${id}`);
                return undefined;
            }
            return LoadState!.show;
        }
        return undefined;
    }

    showList(): { id: string; displayName: string }[] {
        const list: { id: string; displayName: string }[] = [];
        this.shows.forEach((entry, key) => {
            list.push({ id: key, displayName: entry.displayName });
        });
        return list;
    }

    setActiveShow(id: string): void {
        if (id !== "system") this.active = id;
    }

    activeShow(): ShowHandler | undefined {
        return this.getShow(this.active);
    }

    private shows: Map<string, ShowLoadState> = new Map<
        string,
        ShowLoadState
    >();

    // private runsheets: Map<string, RunsheetLoadState> = new Map<
    //     string,
    //     ShowLoadState
    // >();

    private active: string = "";
}
