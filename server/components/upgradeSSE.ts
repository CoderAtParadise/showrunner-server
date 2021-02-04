const updgradeSSE = (res: any) => {
  //prettier-ignore
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive",
  });
  res.flushHeaders();
};

export default updgradeSSE;