// import { MutableClockSource } from "./ClockSource";
// import { ShowHandler } from "./ShowHandler";
// import { SMPTE, Offset } from "./SMPTE";

// export class OffsetClockSource implements MutableClockSource {
//     constructor(id: string, authority: string, offset: SMPTE) {
//         this.id = id;
//         this.authority = authority;
//         this.offset = offset;
//     }

//     clock(): SMPTE {
//         let offsetFromAuthority: SMPTE;
//         if (
//             this.offset.offset() === Offset.NONE ||
//             this.offset.offset() === Offset.START
//         )
//             offsetFromAuthority = this.offset;
//         else offsetFromAuthority = this.offset;

//         return (
//             this.showHandler
//                 ?.getClock(this.authority)
//                 .clock()
//                 .subtract(offsetFromAuthority) || new SMPTE()
//         );
//     }

//     data(): object | undefined {
//         return { authority: this.authority, offset: this.offset };
//     }

//     setData(data: any): void {
//         if (data as ShowHandler) this.showHandler = data;
//         if (data?.showHandler as ShowHandler) this.showHandler = data.showHandler;
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
