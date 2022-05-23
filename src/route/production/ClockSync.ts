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
                const clocks: object[] = [];
                if (show === "system") {
                    globalShowHandler()
                        .get("clocks")
                        .forEach((clock: ClockSource<any>) => {
                            clocks.push(
                                ClockSourceCodec.serialize(clock) as object
                            );
                        });
                }

                return clocks;
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
                    id: id,
                    data: diff
                })}\n\n`
            );
        };

        const cb = () => {
            const gatherClocks = () => {
                const clocks: object[] = [];
                if (show === "system") {
                    globalShowHandler()
                        .get("clocks")
                        .forEach((clock: ClockSource<any>) => {
                            clocks.push({
                                identifier: clock.identifier,
                                currentState: {
                                    current: clock.current().toString(),
                                    state: clock.state,
                                    overrun: clock.overrun,
                                    incorrectFramerate: clock.incorrectFramerate
                                }
                            });
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
            res.end();
        });
        initial();
        EventHandler.addListener("clock", cb);
        EventHandler.addListener(
            `clock-update-${req.params.show}:${req.params.session}`,
            updatecb
        );
    }
);

export default router;
