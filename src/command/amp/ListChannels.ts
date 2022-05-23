import { AmpChannel } from "@coderatparadise/amp-grassvalley";
import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { externalSourceManager } from "../../show/ExternalSourceManager";

export const ListChannels: ICommand<{}> = {
    id: "amp.channel",
    validate: (): CommandReturn | undefined => {
        return undefined;
    },
    run: (): CommandReturn => {
        return {
            status: 200,
            message: externalSourceManager.getAllOfType(AmpChannel.name)
        };
    }
};
