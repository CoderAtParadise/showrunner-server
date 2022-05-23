import { CommandReturn, ICommand } from "@coderatparadise/showrunner-common";
import { videoCache } from "../../show/AmpChannelSource";

export const ListVideos: ICommand<{ channel: string }> = {
    id: "amp.list",
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
        const channel = videoCache.get(data!.channel);
        if (channel) return { status: 200, message: channel };
        else {
            return {
                status: 400,
                error: "amp.unknownchannel",
                message: `Unknown Amp Channel ${data!.channel}`
            };
        }
    }
};
