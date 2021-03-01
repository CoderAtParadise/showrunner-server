import {Response} from "express";

const updgradeSSE = (res: Response) => {
  //prettier-ignore
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive",
  });
  res.flushHeaders();
};

export default updgradeSSE;