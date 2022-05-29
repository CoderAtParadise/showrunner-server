import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { externalSourceManager } from "../../show/ExternalSourceManager";

export const RestartChannel: ICommand<{ channel: string }> = {
    id: "amp.restart",
    validate: (data?: any): CommandReturn | undefined => {
        console.log(data);
        // prettier-ignore
        return data.channel !== undefined
            ? undefined
            : { status: 400, error: "amp.missingChannel", message: "Missing amp channel" };
    },
    run: (
        commandInfo: { show: string; session: string },
        data?: { channel: string }
    ): CommandReturn => {
        const source = externalSourceManager.getSource(data!.channel);
        if (source) {
            source.restart();
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
