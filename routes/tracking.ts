import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/eventhandler";
import Timer from "../components/timer";
import Time from "../components/time";
import upgradeSSE from "../components/upgradeSSE";

router.get("/timers", (req: Request, res: Response) => {
  upgradeSSE(res);
  const buildTracking = () => {
      const obj = {clock:Time.stringify(Time.now()),tracking:[]};
      return obj;
  }
  Timer.current({start:Time.now(),end:Time.now(),show:false});
  eventhandler.on("timer",() => {
    res.write(`event: timer\ndata: ${JSON.stringify(buildTracking())}\n\n`);
  });
});

router.get("/current",(req:Request,res:Response) => {
  upgradeSSE(res);
  
  eventhandler.on("switch:item",() => {

  });
});

router.get("/direction", (req: Request, res: Response) => {
  upgradeSSE(res);
  let targets: string[];
  if (req.query.target) targets = (req.query.target as string).split(",");

  eventhandler.on("direction", (target, message) => {
    if (targets.length === 0 || targets.includes(target))
      res.write(
        `event: direction\ntarget: ${target}\ndata: ${JSON.stringify(
          message
        )}\n\n`
      );
  });
});

export default router;
