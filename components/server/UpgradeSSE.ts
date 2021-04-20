import {Response} from "express";

const updgradeSSE = (res: Response) => {
  //prettier-ignore
  res.set({
    "Connection": "keep-alive",
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Access-Control-Allow-Origin": "*",
    "retry":10000
  });
  res.flushHeaders();
};

export default updgradeSSE;