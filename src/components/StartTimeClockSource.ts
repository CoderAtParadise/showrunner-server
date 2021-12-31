// import {
//     MutableClockSource,
//     ShowHandler,
//     SMPTE,
//     Offset,
//     getSyncClock
// } from "@coderatparadise/showrunner-common";

// export class StartTimeClockSource implements MutableClockSource {
//     constructor(id: string, startTime: SMPTE) {
//         this.id = id;
//         this.startTime = startTime;
//     }

//     /**
//      * @returns Returns time until start
//      */
//     clock(): SMPTE {
//         return getSyncClock().current().subtract(this.startTime);
//     }

//     data(): object | undefined {
//         return { startTime: this.startTime };
//     }

//     setData(data: any): void {
//         if (data instanceof SMPTE) this.startTime = data;
//         if (data?.startTime as SMPTE) this.startTime = data.startTime;
//     }

//     id: string;
//     private startTime: SMPTE;
// }

// export class StartTimeOffsetClockSource implements MutableClockSource {
//     constructor(id: string, authority: string, offset: SMPTE) {
//         this.id = id;
//         this.authority = authority;
//         this.offset = offset;
//     }

//     clock(): SMPTE {
//         return new SMPTE();
//         // let offsetFromAuthority: SMPTE;
//         // const authorityClock: SMPTE =
//         //     this.showHandler?.getClock(this.authority).clock() || new SMPTE();
//         // if (
//         //     this.offset.offset() === Offset.NONE ||
//         //     this.offset.offset() === Offset.START
//         // )
//         //     offsetFromAuthority = authorityClock.add(this.offset);
//         // else offsetFromAuthority = authorityClock.subtract(this.offset);

//         // return getSyncClock().clock().subtract(offsetFromAuthority);
//     }

//     data(): object | undefined {
//         return { authority: this.authority, offset: this.offset };
//     }

//     setData(data: any): void {
//         if (data as ShowHandler) this.showHandler = data;
//         if (data?.showHandler as ShowHandler)
//             this.showHandler = data.showHandler;
//         if (data as string) this.authority = data;
//         if (data?.authority as string) this.authority = data.authority;
//         if (data as SMPTE) this.offset = data;
//         if (data?.offset as SMPTE) this.offset = data.offset;
//     }

//     id: string;
//     private showHandler: ShowHandler | undefined;
//     private authority: string;
//     private offset: SMPTE;
// }
