import { AmpChannel } from "@coderatparadise/amp-grassvalley";
import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { AmpChannelSource } from "../../show/AmpChannelSource";
import { externalSourceManager } from "../../show/ExternalSourceManager";

export const ListChannels: ICommand<{}> = {
    id: "amp.channel",
    validate: (): CommandReturn | undefined => {
        return undefined;
    },
    run: (): CommandReturn => {
        return {
            status: 200,
            message: externalSourceManager
                .getAllOfType(AmpChannel.name)
                .map((value) => {
                    return {
                        id: value.id,
                        displayName: value.name,
                        address: value.address,
                        port: value.port,
                        framerate: (value as AmpChannelSource).frameRate,
                        channel: (value as AmpChannelSource).channel
                    };
                })
        };
    }
};
