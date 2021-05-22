import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/server/Eventhandler";
import updgradeSSE from "../components/server/UpgradeSSE";
import { stringify } from "../components/common/time";
import {
  ControlHandler,
  RunsheetList,
  TemplateList,
} from "../components/server/Control";
import { CommandRegisty } from "../components/server/command/ICommand";
import ClockSource from "../components/common/ClockSource";

router.get("/sync", async (req: Request, res: Response) => {
  updgradeSSE(res);
  const cb = (event: string, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  res.on("close", () => {
    eventhandler.removeListener("sync", cb);
    res.end();
  });
  eventhandler.on("sync", cb);
});

router.get("/clock", async (req: Request, res: Response) => {
  updgradeSSE(res);
  const cb = () => {
    const convertClocks = () => {
      const clocks: object[] = [];
      ControlHandler.clocks.forEach((source: ClockSource) =>
        clocks.push({ clock: source.id, value: stringify(source.clock()) })
      );
      return clocks;
    };
    res.write(`event: clock\ndata: ${JSON.stringify(convertClocks())}\n\n`);
  };
  res.on("close", () => {
    eventhandler.removeListener("clock", cb);
    res.end();
  });
  eventhandler.on("clock", cb);
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
