import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/eventhandler";
import updgradeSSE from "../components/upgradeSSE";
import Structure from "../components/structure";
import Control from "../components/control"

router.get("/direction", async (req: Request, res: Response) => {
  updgradeSSE(res);
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

router.post("/", (req: Request, res: Response) => {

  const command = {} as Control.Command;
  switch(command.command) {
    case "goto":
      Control.goto(command);
      break;
  }
  res.sendStatus(200); //better message
});

router.get("/runsheets", (req: Request, res: Response) => {
  //res.status(200).json(ListRunsheets());
});

router.get("/load", (req: Request, res: Response) => {
  const runsheetF = req.query.runsheet as string;
  let mode = req.query.mode as string;
  if (!mode) mode = "show";
  Structure.Runsheet.LoadRunsheet(
    runsheetF,
    (runsheet) => {
      if (runsheet.err)
        res
          .status(404)
          .json({ error: true, message: `Failed to load ${runsheetF}` });
      else {
        res.status(200).json(runsheet);
      }
    }
  );
});

router.post("/comand", (req: Request, res: Response) => {
  if (!req.body.session || !req.query.bracket || !req.query.item) {
    res.status(400).json({
      error: true,
      message: "goto requires session, bracket and item query parameters",
    });
    return;
  }
  res.sendStatus(200); //better message
});

router.get("/delete", (req: Request, res: Response) => {
  if (!req.query.session) {
    res.status(400).json({
      error: true,
      message: "Missing session query parameter",
    });
    return;
  }
});

export default router;
