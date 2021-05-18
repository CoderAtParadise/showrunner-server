import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/server/Eventhandler";
import updgradeSSE from "../components/server/UpgradeSSE";
import {stringify,now} from "../components/common/time";
import {ControlHandler,Command,Goto,LoadRunsheet,RunsheetList, TemplateList, DeleteRunsheet, Delete,Update,NewRunsheet} from "../components/server/Control";
import {JSON as RJSON} from "../components/common/Runsheet";
import {TrackingSession,SESSION_JSON as TJSON} from "../components/common/Tracking";

router.get("/sync", async (req: Request, res: Response) => {
  updgradeSSE(res);
  if (ControlHandler.loaded) {
    res.write(
      `event: runsheet\ndata: ${JSON.stringify(RJSON.serialize(ControlHandler.loaded))}\n\n`
    );
    const tracking_list: object[] = [];
        ControlHandler.tracking.forEach((value:TrackingSession) => tracking_list.push(TJSON.serialize(value)));
    res.write(
      `event: tracking_list\ndata: ${JSON.stringify(tracking_list)}\n\n`
    );
    res.write(
      `event: current\ndata: ${JSON.stringify(ControlHandler.current)}\n\n`
    );
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

router.get("/clock", async (req: Request, res: Response) => {
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

router.get("/runsheets",(req:Request,res:Response) => {
  res.json(RunsheetList());
});

router.get("/templates",(req:Request,res:Response) => {
  res.json(TemplateList());
});

router.post("/command", (req: Request, res: Response) => {
  const command = req.body as Command;
   schedule(() => {
    switch (command.command) {
      case "goto":
        Goto(command);
        break;
      case "load":
        LoadRunsheet(command);
        break;
      case "update":
        Update(command);
        break;
      case "disable":
        //Disable(command);
        break;
      case "delete":
        Delete(command);
        break;
      case "deleterunsheet":
        DeleteRunsheet(command);
        break;
      case "newrunsheet":
        NewRunsheet(command);
        break;
    }
  });
  res.sendStatus(200); //better message
});

export default router;
