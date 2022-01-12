import { Router, Request, Response } from "express";
import { EventHandler } from "../Scheduler";
import updgradeSSE from "../util/UpgradeSSE";
import { getSyncClock } from "@coderatparadise/showrunner-common";
export const router = Router();

router.get("/sync", async (req: Request, res: Response) => {
    updgradeSSE(res);
    const cb = () => {
        res.write(
            `event:sync\ndata: ${getSyncClock().current().toString()}\n\n`
        );
    };
    res.on("close", () => {
        EventHandler.removeListener("clock", cb);
        res.end();
    });
    EventHandler.addListener("clock", cb);
});

export default router;
