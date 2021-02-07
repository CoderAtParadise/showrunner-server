import { Bracket } from "./bracket"

export class Session {
    id: string;
    brackets: Bracket[] = [];

    constructor(id: string) {
        this.id = id;
    }
}