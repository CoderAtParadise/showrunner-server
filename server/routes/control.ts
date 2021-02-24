import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/eventhandler";
import updgradeSSE from "../components/upgradeSSE";
import { getActiveRunsheet, ListRunsheets, LoadRunsheet } from "../components/runsheet";
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

router.get("/goto", (req: Request, res: Response) => {
  if (!req.query.session || !req.query.bracket || !req.query.item) {
    res.status(400).json({
      error: true,
      message: "goto requires session, bracket and item query parameters",
    });
    return;
  }

  const sessionIndex: number = parseInt(req.query.session as string);
  const bracketIndex: number = parseInt(req.query.bracket as string);
  const itemIndex: number = parseInt(req.query.item as string);
  const restart: string = req.query.restart as string;
  res.sendStatus(200); //better message
});

router.get("/runsheets", (req: Request, res: Response) => {
  res.status(200).json(ListRunsheets());
});

router.get("/load", (req: Request, res: Response) => {
  const runsheetF = req.query.runsheet as string;
  LoadRunsheet(runsheetF);
  res.sendStatus(200);
});

router.get("/enabledstate", (req: Request, res: Response) => {
  if (!req.query.session || !req.query.bracket || !req.query.item) {
    res.status(400).json({
      error: true,
      message: "goto requires session, bracket and item query parameters",
    });
    return;
  }

  const sessionIndex = parseInt(req.query.session as string);
  const bracketIndex = parseInt(req.query.bracket as string);
  const itemIndex = parseInt(req.query.item as string);
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
