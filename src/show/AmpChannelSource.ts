import { AmpChannel } from "@coderatparadise/amp-grassvalley";
import { ExternalSource } from "./ExternalSourceManager";
export const videoCache: Map<string, string[]> = new Map<string, string[]>();

export class AmpChannelSource implements ExternalSource<AmpChannel> {
    constructor(
        id: string,
        name: string,
        address: string,
        port: number,
        channel?: string,
        retry?: { maxRetries: number; timeBetweenRetries: number[] }
    ) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.port = port;
        this.channel = channel;
        this.maxRetries = retry?.maxRetries || 10;
        this.timeBetweenRetries = retry?.timeBetweenRetries || [10000];
    }

    async open(retryHandler: () => Promise<boolean>): Promise<boolean> {
        this.source = new AmpChannel(this.address, this.port, this.channel);
        videoCache.set(this.id, []);
        return await this.source.open(retryHandler);
    }

    isOpen(): boolean {
        return this.source?.isOpen() || false;
    }

    close(): void {
        this.source?.close();
        videoCache.set(this.id, []);
    }

    get(): AmpChannel {
        if (this.source) return this.source;
        throw new Error("Amp Channel not open");
    }

    id: string;
    type: string = AmpChannel.name;
    maxRetries: number;
    timeBetweenRetries: number[];
    name: string;
    address: string;
    port: number;
    channel: string | undefined;
    source: AmpChannel | undefined = undefined;
    tryCounter: number = 0;
}
