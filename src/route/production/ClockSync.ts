import { Router, Request, Response } from "express";
import { EventHandler } from "../../Scheduler";
import updgradeSSE from "../../util/UpgradeSSE";
import { ClockSource } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { ClockSourceCodec } from "../../codec/sync/ClockSourceCodec";
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
                            return ClockSourceCodec.serialize(clock) as object;
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
                .find((clock) => (clock.identifier.id === id));
            res.write(
                `event:clocks-add\ndata: ${JSON.stringify(
                    ClockSourceCodec.serialize(clock)
                )}\n\n`
            );
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
                                    state: clock.state,
                                    overrun: clock.overrun,
                                    incorrectFramerate:
                                        clock.incorrectFramerate()
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
    }
);

export default router;
