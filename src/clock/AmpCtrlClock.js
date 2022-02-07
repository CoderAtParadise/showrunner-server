const udp = require("dgram");
const { ClockState, SMPTE } = require("@coderatparadise/showrunner-common");

class AMPCtrlClock {
    constructor(port) {
        this.id = "ampctrlclock";
        this.displayName = "Video Clock";
        this.owner = "system";
        this.show = "system";
        this.type = "ampctrlclock";
        this.overrun = false;
        this.automation = false;

        this.clockState = ClockState.RESET;
        this.time = 0;

        this.server = [];
        this.port = port;

        this.server = udp.createSocket("udp4");
        this.createServer(this);

        // PVS Remote time - seconds and some resemblance of frames
        this.rawTime = 0;
        // Previous PVS time - used for comparison in setClockState
        this.lastTime = undefined;
    }

    current() {
        if (this.clockState === ClockState.STOPPED || this.clockState === ClockState.RESET) return new SMPTE();
        return new SMPTE(this.time * 25); // Multiply by 25 to get offset by frames
    }

    update() {
        // we'll need to figure this out
        // console.log("Video time is " + this.time)
        this.time = Math.floor(this.rawTime);
    }

    start() {
        // NOOP
    }

    pause() {
        // NOOP
    }

    stop() {
        // NOOP
    }

    reset() {
        // NOOP
    }

    data() {
        return undefined;
    }

    setClockState(now) {
        const time = now;
        if (now === this.lastTime && this.clockState !== ClockState.STOPPED) {
            console.log("PVS Model: Stopped");
            this.clockState = ClockState.STOPPED;
        } else if (
            now !== this.lastTime &&
            this.lastTime !== undefined &&
            now - this.lastTime < 1
        ) {
            console.log("PVS Model: Playing");
            this.clockState = ClockState.RUNNING;
        }

        this.lastTime = time;
    }

    createServer(self) {
        const that = self;

        this.server.on("error", function (error) {
            console.log("Socket error", error);
            // this.server.close()
        });

        this.server.on("message", function (message) {
            that.rawTime = message * 1;
            that.setClockState(that.rawTime);
        });

        this.server.on("close", function () {
            console.log("AMP MODEL: Connection closed");
        });

        this.server.bind(this.port);
    }
}

module.exports = {
    AMPCtrlClock
};
