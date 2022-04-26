import { AmpChannel } from "@coderatparadise/amp-grassvalley";

export const openChannels: Map<string, AmpChannel> = new Map<
    string,
    AmpChannel
>();

export const videoCache: Map<string, string[]> = new Map<string, string[]>();

export function openChannel(
    name: string,
    address: string,
    port: number,
    channel?: string
) {
    openChannels.set(name, new AmpChannel(address, port, channel));
    openChannels.get(name)!.open();
    videoCache.set(name, []);
}

export function closeChannels() {
    openChannels.forEach((value) => value.close());
}
