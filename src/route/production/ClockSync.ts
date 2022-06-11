import { Router, Request, Response } from "express";
import { EventHandler } from "../../Scheduler";
import updgradeSSE from "../../util/UpgradeSSE";
import { ClockSource } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockSourceSyncCodec } from "../../codec/sync/ClockSourceSyncCodec";
export const router = Router();

router.get(
    "/production/:show/:session/clocks",
    async (req: Request, res: Response) => {
        const show = req.params.show;
        const session = req.params.session;
        updgradeSSE(res);
        const initial = () => {
            const gatherClocks = () => {
                if (show === "system") {
                    return globalShowHandler()
                        .get("clocks")
                        .map((clock: ClockSource<any>) => {
                            return ClockSourceSyncCodec.serialize(
                                clock
                            ) as object;
                        });
                }
                return [];
            };
            res.write(
                `event:clocks-initial\ndata: ${JSON.stringify(
                    gatherClocks()
                )}\n\n`
            );
        };

        const updatecb = (id: string, diff: object) => {
            res.write(
                `event:clocks-update\ndata: ${JSON.stringify({
                    id,
                    data: diff
                })}\n\n`
            );
        };

        const addcb = (id: string) => {
            const clock = globalShowHandler()
                .get("clocks")
                .find((clock) => clock.identifier.id === id);
            res.write(
                `event:clocks-add\ndata: ${JSON.stringify(
                    ClockSourceSyncCodec.serialize(clock)
                )}\n\n`
            );
        };

        const deletecb = (id: string) => {
            res.write(`event:clocks-delete\ndata: ${id}\n\n`);
        };

        const cb = () => {
            const gatherClocks = () => {
                const clocks: object[] = [];
                if (show === "system") {
                    return globalShowHandler()
                        .get("clocks")
                        .map((clock: ClockSource<any>) => {
                            return {
                                identifier: clock.identifier,
                                currentState: {
                                    current: clock.current().toString(),
                                    state: clock.status(),
                                    overrun: clock.isOverrun(),
                                    incorrectFramerate:
                                        clock.hasIncorrectFrameRate()
                                }
                            };
                        });
                }

                return clocks;
            };
            res.write(
                `event:clocks-sync\ndata: ${JSON.stringify(gatherClocks())}\n\n`
            );
        };
        res.on("close", () => {
            EventHandler.removeListener("clock", cb);
            EventHandler.removeListener(
                `clock-update-${req.params.show}:${req.params.session}`,
                updatecb
            );
            EventHandler.removeListener(
                `clock-add-${req.params.show}:${req.params.session}`,
                addcb
            );
            EventHandler.removeListener(
                `clock-delete-${req.params.show}:${req.params.session}`,
                deletecb
            );
            res.end();
        });
        initial();
        EventHandler.addListener("clock", cb);
        EventHandler.addListener(
            `clock-update-${req.params.show}:${req.params.session}`,
            updatecb
        );
        EventHandler.addListener(
            `clock-add-${req.params.show}:${req.params.session}`,
            addcb
        );
        EventHandler.addListener(
            `clock-delete-${req.params.show}:${req.params.session}`,
            deletecb
        );
    }
);

export default router;
