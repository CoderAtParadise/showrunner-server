import { Router, Request, Response } from "express";
import {
    executeCommand,
    commandExists
} from "@coderatparadise/showrunner-common";
import { schedule } from "../Scheduler";
export const router = Router();

router.post("/command", (req: Request, res: Response) => {
    const data = req.body as { command: string; data: any };
    if (commandExists(data.command)) {
        schedule(() => {
            executeCommand(data.command, data.data);
        });
        return res.sendStatus(200);
    }
    return res.sendStatus(404);
});

export default router;
