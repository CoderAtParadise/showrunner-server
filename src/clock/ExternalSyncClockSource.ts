// import {
//     MutableClockSource,
//     SMPTE,
//     ClockState
// } from "@coderatparadise/showrunner-common";

// class ExternalSyncClockSource implements MutableClockSource {
//     current(): SMPTE {
//         return new SMPTE(new Date());
//     }

//     data(): object | undefined {
//         return undefined;
//     }

//     start(): void {
//         // NOOP
//     }

//     pause(): void {
//         // NOOP
//     }

//     stop(): void {
//         // NOOP
//     }

//     reset(): void {
//         // NOOP
//     }

//     state(): ClockState {
//         return this.mState;
//     }

//     setData(): void {
//         // NOOP
//     }

//     id: string = "external_sync";
//     mState: ClockState = ClockState.STOPPED;
// }

// // export const ExternalSyncClockSource: ExternalSync = {
// //     id: "external_sync",
// //     current(): SMPTE {
// //         return new SMPTE(new Date());
// //     },
// //     data(): object | undefined {
// //         return undefined;
// //     },
// //     start(): void {
// //         // NOOP
// //     },
// //     pause(): void {
// //         // NOOP
// //     },
// //     stop(): void {
// //         // NOOP
// //     },
// //     reset(): void {
// //         // NOOP
// //     },
// //     state(): ClockState {
// //         return this.mState;
// //     },
// //     setData(): void {
// //         // NOOP
// //     },

// //     mState: ClockState.STOPPED
// // };

// export default { ExternalSyncClockSource };
