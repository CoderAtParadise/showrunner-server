import { AmpChannel } from "@coderatparadise/amp-grassvalley";
import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { ServerSettings } from "../../ServerSettings";
import {
    ExternalSource,
    externalSourceManager
} from "../../show/ExternalSourceManager";

export const GetServerSettings: ICommand<{}> = {
    id: "server.settings",
    validate: function (data?: any): CommandReturn | undefined {
        return undefined;
    },
    run: function (): CommandReturn {
        const ampChannels = externalSourceManager
            .getAllOfType(AmpChannel.name)
            .map((value: ExternalSource<any>) => value.configure());
        return {
            status: 200,
            message: {
                server: {
                    ...ServerSettings,
                    ampChannels: ampChannels
                }
            }
        };
    }
};
