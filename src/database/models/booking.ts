import { Room } from "./room";

export interface Booking {
    id: string;
    email: string;
    bookingDate: Date;
    roomId: Room["id"];
}
