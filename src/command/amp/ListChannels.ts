import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { openChannels } from "../../show/AmpChannelManager";

export const ListChannels: ICommand<{}> = {
    id: "amp.channel",
    validate: (): CommandReturn | undefined => {
        return undefined;
    },
    run: (): CommandReturn => {
        return {
            status: 200,
            message: Array.from(openChannels.keys())
        };
    }
};
