import {Response} from "express";

const updgradeSSE = (res: Response) => {
  //prettier-ignore
  res.set({
    "Connection": "keep-alive",
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Access-Control-Allow-Origin": "*"
  });
  res.flushHeaders();
};

export default updgradeSSE;