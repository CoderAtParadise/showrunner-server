import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/eventhandler";
import updgradeSSE from "../components/upgradeSSE";
import Control from "../components/control";
import Time from "../components/time";
import Tracking from "../components/tracking";

router.get("/sync", async (req: Request, res: Response) => {
  updgradeSSE(res);
  res.write(
    `event: current\ndata: ${JSON.stringify(Tracking.getActiveLocation())}\n\n`
  );
  eventhandler.on("sync", (event: string, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
});

router.get("/clock", async (req: Request, res: Response) => {
  updgradeSSE(res);
  eventhandler.on("clock", () => {
    res.write(`event: clock\ndata: ${Time.stringify(Time.now())}\n\n`);
  });
});

router.post("/", (req: Request, res: Response) => {
  const command = {} as Control.Command;
  schedule(() => {
    switch (command.command) {
      case "goto":
        Control.goto(command);
        break;
    }
  });
  res.sendStatus(200); //better message
});

export default router;
