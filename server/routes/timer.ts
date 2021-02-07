import {Router} from "express";
const router = Router();
import { getTimer, getTimers, Timepoint, Timer } from "../components/timer";
import { eventhandler, schedule } from "../components/eventhandler";
import upgradeSSE from "../components/upgradeSSE";
import { stringify } from "querystring";
import { timeStamp } from "console";

class TimersRespone {
  clock = Timepoint.now().tostring();
  timers: TimerObject[] = [];
}

class TimerObject {
  id: string;
  current: string;

  constructor(id: string,current: Timepoint) {
    this.id = id;
    this.current = current.tostring();
  }
}

const sendTimers = (map: Map<string,Timer>) => {
  const obj = new TimersRespone();
  map.forEach((value,key) => obj.timers.push(new TimerObject(key,value.currentTimer())));
  return JSON.stringify(obj);
};

router.get("/timers", async (req: any, res: any) => {
  upgradeSSE(res);
  eventhandler.on("timer", () => {
    res.write(`event: timer\ndata: ${sendTimers(getTimers)}\n\n`);
  });
});

router.post("/timer/create", (req: any, res: any) => {});

router.get("/clock", (req: any, res: any) => {
  res.status(200).json({ time: Timepoint.now().tostring() });
});

router.get("/timer/:id", (req: any, res: any) => {
  const timer = getTimer(req.params.id);
  if (!timer) {
    res.status(404).json({
      error: true,
      message: `No timer exists with id: ${req.params.id}`,
    });
  } else {
    let command = req.query.command;
    if (!command) {
      res.status(200).json(timer.status(undefined));
      return;
    }

    switch (command) {
      case "start":
        schedule(() => timer.start());
        res.status(200).json(timer.status(true));
        break;
      case "stop":
        schedule(() => timer.stop());
        res.status(200).json(timer.status(false));
        break;
      case "reset":
        schedule(() => timer.reset());
        res.status(200).json(timer.status(false));
        break;
      case "restart":
        schedule(() => timer.restart());
        res.status(200).json(timer.status(true));
        break;
      default:
        res.status(400).json({
          error: true,
          message: `Unknown Timer Command: ${req.params.id}`,
        });
    }
  }
});

export default router;
