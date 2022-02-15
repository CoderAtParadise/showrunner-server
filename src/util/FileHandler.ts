import {
    ClockDirection,
    ShowHandler
} from "@coderatparadise/showrunner-common";
import debug from "debug";
import fs from "fs";
import {
    OffsetSettings,
    TimerSettings,
    ToTimeSettings
} from "../clock/ClockData";
import { CreateCommand } from "../command/clock/Create";
import { globalShowHandler } from "../show/GlobalShowHandler";
import { LooseObject } from "./LooseObject";

export const saveClocks = (): void => {
    const saveObject: object[] = [];
    globalShowHandler()
        .listClocks()
        .forEach((clock) => {
            if (
                clock.clock.type !== "sync" &&
                clock.clock.type !== "ampctrlclock"
            ) {
                const object: LooseObject = {};
                object.type = clock.clock.type;
                object.owner = clock.clock.owner;
                object.displayName = clock.clock.displayName;
                let settings;
                switch (clock.clock.type) {
                    case "tod:offset":
                        object.type = "offset";
                    // eslint-disable-next-line no-fallthrough
                    case "offset":
                        settings = (clock.clock.data() as any)
                            .settings as OffsetSettings;
                        object.time = settings.offset.toString();
                        object.direction = ClockDirection.COUNTDOWN;
                        object.behaviour = settings.behaviour;
                        object.authority = settings.authority;
                        break;
                    case "tod":
                        settings = (clock.clock.data() as any)
                            .settings as ToTimeSettings;
                        object.time = settings.time.toString();
                        object.direction = ClockDirection.COUNTDOWN;
                        object.behaviour = settings.behaviour;
                        object.authority = "";
                        break;
                    case "timer":
                        settings = (clock.clock.data() as any)
                            .settings as TimerSettings;
                        object.time = settings.duration.toString();
                        object.direction = settings.direction;
                        object.behaviour = settings.behaviour;
                        object.authority = "";
                        break;
                }
                saveObject.push({
                    show: clock.clock.show,
                    id: clock.clock.id,
                    data: object
                });
            }
        });
    save("storage", "clocks", saveObject);
};

export const loadClocks = (): void => {
    load("storage", "clocks", (json: any) => {
        json.forEach((j: any) => {
            if (CreateCommand.validate(j) === undefined) CreateCommand.run(j);
        });
    });
};

export const saveShowHandler = (show: ShowHandler): void => {
    const saveObject: {
        id: string;
        displayName: string;
    } = { id: show.id, displayName: show.displayName };
    save("storage/runsheet", show.location, saveObject);
};

// export const loadShowHandler = (id: string, location: string): void => {
//     // NOOP
// };

const save = (dir: string, name: string, json: any): void => {
    fs.writeFile(
        `${dir}/${name}.json`,
        JSON.stringify(json),
        (err: Error | null) => {
            if (err) debug("showrunner:io")(err);
        }
    );
};

function load(dir: string, name: string, cb: (json: any) => void) {
    fs.readFile(`${dir}/${name}.json`, (err: Error | null, buffer: Buffer) => {
        if (err) debug("showrunner:io")(err);
        else cb(JSON.parse(buffer.toString()));
    });
}

export const deleteFile = (dir: string, name: string): void => {
    fs.unlink(`${dir}/${name}.json`, () => {});
};
