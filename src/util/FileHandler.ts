import {
    ShowHandler
} from "@coderatparadise/showrunner-common";
import debug from "debug";
import fs from "fs";
import { ClockSourceFileCodec } from "../codec/file/ClockSourceFileCodec";
import { CreateCommand } from "../command/clock/Create";
import { globalShowHandler } from "../show/GlobalShowHandler";

export const saveClocks = (): void => {
    const saveObject: object[] = [];
    globalShowHandler()
        .get("clocks")
        .forEach((clock) => {
            if (
                clock.type !== "sync" &&
                clock.type !== "ampctrl" &&
                clock.type !== "videoctrl"
            ) {
                saveObject.push(
                    ClockSourceFileCodec.serialize(clock) as object
                );
            }
        });
    save("storage", "clocks", saveObject);
};

export const loadClocks = (): void => {
    load("storage", "clocks", (json: any) => {
        json.forEach((j: any) => {
            const commandData = {
                type: j.type,
                id: j.identifier.id,
                owner: j.identifier.owner,
                ...j.settings
            };
            const identifier = {
                show: j.identifier.show,
                session: j.identifier.session
            };
            if (CreateCommand.validate(commandData) === undefined)
                CreateCommand.run(identifier, commandData);
        });
    });
};

export const saveShowHandler = (show: ShowHandler): void => {
    const saveObject: {
        id: string;
        displayName: string;
    } = { id: show.id, displayName: show.displayName };
    save("storage/runsheet", show.id, saveObject);
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
