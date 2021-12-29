import { Response } from "express";

const updgradeSSE = (res: Response) => {
    // prettier-ignore-start
    /* eslint-disable quote-props */
    res.set({
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        "Access-Control-Allow-Origin": "*",
        retry: 10000
    });
    /* eslint-enable quote-props */
    // prettier-ignore-end
    res.flushHeaders();
};

export default updgradeSSE;
