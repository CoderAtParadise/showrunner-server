import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { externalSourceManager } from "../../show/ExternalSourceManager";

export const RemoveChannel: ICommand<{ channel: string }> = {
    id: "amp.remove",
    validate: (data?: any): CommandReturn | undefined => {
        // prettier-ignore
        return data.channel !== undefined
            ? undefined
            : { status: 400, error: "amp.missingChannel", message: "Missing amp channel" };
    },
    run: (
        commandInfo: { show: string; session: string },
        data?: { channel: string }
    ): CommandReturn => {
        if (externalSourceManager.removeSource(data!.channel)) {
            return {
                status: 200,
                message: ""
            };
        } else {
            return {
                status: 400,
                error: "amp.unknownchannel",
                message: `Unknown Amp Channel ${data!.channel}`
            };
        }
    }
};
