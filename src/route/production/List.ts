import { Router, Request, Response } from "express";
import { EventHandler } from "../../Scheduler";
import updgradeSSE from "../../util/UpgradeSSE";
export const router = Router();

router.get("/production/:show/runsheet", async (req: Request, res: Response) => {
    updgradeSSE(res);
    const cb = () => {
        const show = req.params.show;
        res.write(`event:runsheet\nshow:${show}\ndata: {}}\n\n`);
    };
    res.on("close", () => {
        EventHandler.removeListener("clock", cb);
        res.end();
    });
    EventHandler.addListener("clock", cb);
});

export default router;
