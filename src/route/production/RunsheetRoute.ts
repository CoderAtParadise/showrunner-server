import { Router, Request, Response } from "express";
import { EventHandler } from "../../Scheduler";
import updgradeSSE from "../../util/UpgradeSSE";
import { ClockIdentifier } from "@coderatparadise/showrunner-common";
import { globalShowHandler } from "../../show/GlobalShowHandler";
import { encodeClockSouce } from "../../util/EncodeClockSource()";
export const router = Router();

router.get("/production/:show/runsheet", async (req: Request, res: Response) => {
    updgradeSSE(res);
    const cb = () => {
        const show = req.params.show;
        const gatherClocks = () => {
            const clocks: object[] = [];
            globalShowHandler()
                .listClocks()
                .forEach((clock: ClockIdentifier) => {
                    clocks.push({
                        clock: encodeClockSouce(clock.clock),
                        active: clock.active,
                        render: clock.render
                    });
                });

            return clocks;
        };
        res.write(`event:runsheet\nshow:${show}\ndata: ${JSON.stringify(gatherClocks())}\n\n`);
    };
    res.on("close", () => {
        EventHandler.removeListener("clock", cb);
        res.end();
    });
    EventHandler.addListener("clock", cb);
});

export default router;
