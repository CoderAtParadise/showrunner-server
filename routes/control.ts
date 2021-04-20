import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/server/Eventhandler";
import updgradeSSE from "../components/server/UpgradeSSE";
import {stringify,now} from "../components/common/time";
import {ControlHandler,Command,Goto,LoadRunsheet} from "../components/server/Control";
import {JSON as RJSON} from "../components/common/Runsheet";

router.get("/sync", async (req: Request, res: Response,next: Function) => {
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
  const cb = (event: string, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  res.on('close',() => {
    eventhandler.removeListener("sync",cb);
    res.end();
  });
  eventhandler.on("sync", cb);
});
const clockCallback = 
router.get("/clock", async (req: Request, res: Response,next:Function) => {
  updgradeSSE(res);
  const cb = () => {
    res.write(`event: clock\ndata: ${stringify(now())}\n\n`);
  };
  res.on('close',() => {
    eventhandler.removeListener("clock",cb);
    res.end();
  });
  eventhandler.on("clock",cb );
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
