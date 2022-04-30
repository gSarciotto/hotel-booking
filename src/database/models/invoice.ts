import { Booking } from "./booking";

export interface Invoice {
    id: string;
    price: string;
    bookingId: Booking["id"];
}
