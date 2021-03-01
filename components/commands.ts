import Tracking from "./tracking";

export namespace Commands {
    interface location {
        session: number;
        bracket?: number;
        item?: number;
    }

        export const goto = (location: location) => {
            const session = Tracking.getTracking("session");
            if(location.bracket) 
            {

            }
            else {
                
            }

        }

        export const change_disable_state = (location: location) => {
            
        }

        export const delete_at = (location: location) => {

        }
}