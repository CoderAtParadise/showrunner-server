import { AmpChannel } from "@coderatparadise/amp-grassvalley";

export const openChannels: Map<string, AmpChannel> = new Map<
    string,
    AmpChannel
>();

export function openChannel(
    name: string,
    address: string,
    port: number,
    channel?: string
) {
    openChannels.set(name, new AmpChannel(address, port, channel));
    openChannels.get(name)!.open();
}

export function closeChannels() {
    openChannels.forEach(value => value.close());
}
