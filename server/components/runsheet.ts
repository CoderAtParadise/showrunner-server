import { Session } from "./session";

interface Role {
    key:string,
    role:string,
    display:string
}

class Runsheet {
  display: string;
  sessions: Session[] = [];
  team: Role[] = [];
  activeSession: number = 0;

  constructor(display: string) {
    this.display = display;
  }

  setActive(index: number,restart:boolean = false) {
    if (this.activeSession !== index || restart) {
      this.activeSession = index;
      this.sessions[this.activeSession].sessionSwitch();
    }
  }

  addSession(session: Session) {
    this.addSessionAtIndex(this.sessions.length, session);
  }

  addSessionAtIndex(index: number, session: Session) {
    this.sessions.splice(index, 0, session);
  }

  deleteSession(index: number) {
    if (
      this.activeSession === index &&
      this.activeSession === this.sessions.length - 1
    )
      this.activeSession--;
    this.sessions.splice(index, 1);
  }
}
