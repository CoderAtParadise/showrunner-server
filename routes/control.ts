import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/server/Eventhandler";
import updgradeSSE from "../components/server/UpgradeSSE";
import {stringify,now} from "../components/common/time";
import {ControlHandler,Command,Goto,LoadRunsheet} from "../components/server/Control";
import {JSON as RJSON} from "../components/common/Runsheet";

router.get("/sync", async (req: Request, res: Response) => {
  updgradeSSE(res);
  if (ControlHandler.loaded) {
    res.write(
      `event: runsheet\ndata: ${JSON.stringify(RJSON.serialize(ControlHandler.loaded))}\n\n`
    );
   /* res.write(
      `event: current\ndata: ${JSON.stringify({
        active: Tracking.activeLocation,
        next: Tracking.next(),
      })}\n\n`
    );
    res.write(
      `event: tracking\ndata: ${JSON.stringify(Tracking.syncTracking())}\n\n`
    );*/
  }
  eventhandler.on("sync", (event: string, data: object) => {
    console.log("derp");
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
});

router.get("/clock", async (req: Request, res: Response) => {
  updgradeSSE(res);
  eventhandler.on("clock", () => {
    res.write(`event: clock\ndata: ${stringify(now())}\n\n`);
  });
});

router.post("/", (req: Request, res: Response) => {
  const command = {} as Command;
  schedule(() => {
    switch (command.command) {
      case "goto":
        Goto(command);
        break;
    }
  });
  res.sendStatus(200); //better message
});

export default router;
