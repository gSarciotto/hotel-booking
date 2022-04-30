import { Booking } from "./booking";

export interface Invoice {
    id: string;
    price: number;
    bookingId: Booking["id"];
}
