import { Router, Request, Response } from "express";
const router = Router();
import EventHandler,{ schedule } from "../components/server/Scheduler";
import updgradeSSE from "../components/server/UpgradeSSE";
import { stringify } from "../components/common/TimePoint";
import { CommandRegisty } from "../components/server/command/ICommand";
import ClockSource from "../components/common/ClockSource";
import { JSON as RJSON } from "../components/common/Runsheet";
import ServerRunsheet from "../components/server/ServerRunsheetHandler";
import TrackingShow, {JSON as TJSON} from "../components/common/TrackingShow";
import {RunsheetList,TemplateList} from "../components/server/FileManager";

router.get("/sync", async (req: Request, res: Response) => {
  updgradeSSE(res);
  if(ServerRunsheet.hasLoadedRunsheet() && ServerRunsheet.runsheet) {
    res.write(`event: show\ndata: ${ServerRunsheet.activeShow()}\n\n`);
    res.write(`event: runsheet\ndata: ${JSON.stringify(RJSON.serialize(ServerRunsheet.runsheet))}\n\n`);
    ServerRunsheet.tracking.forEach((value:TrackingShow) => {
      res.write(`event: tracking\ndata: ${JSON.stringify(TJSON.serialize(value))}\n\n`);
    });
  }
  const cb = (event: string, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  res.on("close", () => {
    EventHandler.removeListener("sync", cb);
    res.end();
  });
  EventHandler.addListener("sync", cb);
});

router.get("/clocks", async (req: Request, res: Response) => {
  updgradeSSE(res);
  const cb = () => {
    const convertClocks = () => {
      const clocks: object[] = [];
      ServerRunsheet.clocks.forEach((source: ClockSource) =>
        clocks.push({ clock: source.id, value: stringify(source.clock()) })
      );
      return clocks;
    };
    res.write(`event: clock\ndata: ${JSON.stringify(convertClocks())}\n\n`);
  };
  res.on("close", () => {
    EventHandler.removeListener("clock", cb);
    res.end();
  });
  EventHandler.on("clock", cb);
});

router.get("/runsheets", (req: Request, res: Response) => {
  res.json(RunsheetList());
});

router.get("/templates", (req: Request, res: Response) => {
  res.json(TemplateList());
});

router.post("/command", (req: Request, res: Response) => {
  const data = req.body as { command: string; data: any };
  const command = CommandRegisty.get(data.command);
  if (command) {
    if (command.validate(data.data)) {
      schedule(() => {
        command.run(data);
      });
      res.sendStatus(200);
    }
  }
  res.sendStatus(404);
});

export default router;
