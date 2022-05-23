export interface ExternalSource<T> {
    readonly id: string;
    readonly type: string;
    maxRetries: number;
    timeBetweenRetries: number[];
    name: string;
    address: string;
    port: number;
    open(retryHandler: () => Promise<boolean>): Promise<boolean>;
    isOpen(): boolean;
    close(): void;
    get(): T;
    tryCounter: number;
}

export class ExternalSourceManager {
    registerSource<T>(source: ExternalSource<T>) {
        if (!this.sources.has(source.id)) {
            this.sources.set(source.id, source);
        }
    }

    async openSource(id: string) {
        if (!this.sources.get(id)?.isOpen()) {
            const source = this.sources.get(id);
            if (source) {
                const tryOpen = async (): Promise<boolean> => {
                    const open = await source.open(tryOpen);
                    if (!open) {
                        source.tryCounter++;
                        const time =
                            source.tryCounter < source.timeBetweenRetries.length
                                ? source.timeBetweenRetries[source.tryCounter]
                                : source.timeBetweenRetries[
                                      source.timeBetweenRetries.length - 1
                                  ];
                        if (source.tryCounter < source.maxRetries) {
                            return new Promise<boolean>((res) => {
                                setTimeout(() => {
                                    res(tryOpen());
                                }, time);
                            });
                        } else return false;
                    } else {
                        source.tryCounter = 0;
                        return true;
                    }
                };
                return await tryOpen();
            }
        }
    }

    isOpen(id: string) {
        return this.sources.get(id)?.isOpen() || false;
    }

    getSource(id: string): ExternalSource<any> | undefined {
        return this.sources.get(id);
    }

    closeAll() {
        this.sources.forEach((source) => source.close());
    }

    getAllOfType(type: string): string[] {
        const channels: string[] = [];
        this.sources.forEach((value: ExternalSource<any>, key: string) => {
            if (value.type === type) channels.push(key);
        });
        return channels;
    }

    // prettier-ignore
    private sources: Map<string,ExternalSource<any>> = new Map<string,ExternalSource<any>>();
}

export const externalSourceManager = new ExternalSourceManager();
