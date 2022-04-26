import { Router, Request, Response } from "express";
import { executeCommand } from "@coderatparadise/showrunner-common";
export const router = Router();

router.post(
    "/production/:show/:session/command",
    (req: Request, res: Response) => {
        const data = req.body as { command: string; data: any };
        const result = executeCommand(
            {
                id: data.command,
                show: req.params.show,
                session: req.params.session
            },
            data.data
        ) as any;
        const status = result.status;
        delete result.status;
        res.status(status).send(result);
    }
);

export default router;
