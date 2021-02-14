import { Router, Request, Response } from "express";
const router = Router();
import { eventhandler, schedule } from "../components/eventhandler";
import updgradeSSE from "../components/upgradeSSE";

router.get("/current", (req: Request, res: Response) => {
  updgradeSSE(res);
  res.write(`event: current\ndata:{}\n\n`);
  eventhandler.on("switch:item", () => {
    res.write(`event: current\ndata:{}\n\n`);
  });
});

const checkSessionExists = (res: Response, sessionIndex: number) => {
  /*if (sessions.length <= sessionIndex) {
    res
      .status(404)
      .json({ error: true, message: `Invalid Session Index: ${sessionIndex}` });
    return null;
  }
  return sessions[sessionIndex];*/
};

const checkBracketExists = (
  res: Response,
  sessionIndex: number,
  bracketIndex: number
) => {
  const session = checkSessionExists(res, sessionIndex);
  if (session) {
    if (session.brackets.length <= bracketIndex) {
      res.status(404).json({
        error: true,
        message: `Invalid Bracket Index: ${bracketIndex} for session: ${session.display}`,
      });
      return null;
    }
    return session?.brackets[bracketIndex];
  }
  return null;
};

const checkItemExists = (
  res: Response,
  sessionIndex: number,
  bracketIndex: number,
  itemIndex: number
) => {
  const bracket = checkBracketExists(res, sessionIndex, bracketIndex);
  if (bracket) {
    if (bracket.items.length <= itemIndex) {
      res.status(404).json({
        error: true,
        message: `Invalid Item Index: ${itemIndex} in bracket: ${bracket.display}`,
      });
      return false;
    }
  }
  return true;
};

router.get("/goto", (req: Request, res: Response) => {
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

  if (!checkItemExists(res, sessionIndex, bracketIndex, itemIndex)) return;
  schedule(() => {
    setActiveSession(sessionIndex);
    const session = sessions[sessionIndex];
    session.setActive(bracketIndex);
    const bracket = session.brackets[bracketIndex];
    bracket.setActive(itemIndex);
  });
  res.sendStatus(200); //better message
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
  if (!checkItemExists(res, sessionIndex, bracketIndex, itemIndex)) return;
  const session = sessions[sessionIndex];
  const bracket = session.brackets[bracketIndex];
  schedule(() => {
    bracket.items[itemIndex].changeEnabledState();
  });
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
  const sessionIndex = parseInt(req.query.session as string);
  if (!req.query.bracket) {
    deleteSession(sessionIndex);
  } else {
    const session = checkSessionExists(res, sessionIndex);
    if (session) {
      const bracketIndex = parseInt(req.query.bracket as string);
      if (!req.query.item) {
        session.deleteBracket(bracketIndex);
      } else {
        const bracket = checkBracketExists(res, sessionIndex, bracketIndex);
        if (bracket) {
          const itemIndex = parseInt(req.query.item as string);
          bracket.deleteItem(itemIndex);
        }
      }
    }
  }
});

export default router;
