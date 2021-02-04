module.exports = (res) => {
  //prettier-ignore
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive",
  });
  res.flushHeaders();
};