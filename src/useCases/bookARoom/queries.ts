import { Knex } from "knex";
import { v4 } from "uuid";
import { Booking } from "../../database/models/booking";
import { RoomDoesntExist } from "./handler";

export async function createANewBooking(
    db: Knex,
    {
        email,
        bookingDate,
        roomId
    }: Pick<Booking, "email" | "bookingDate" | "roomId">
): Promise<Booking> {
    try {
        return (
            await db<Booking>("bookings")
                .insert({
                    id: v4(),
                    email,
                    bookingDate,
                    roomId
                })
                .returning("*")
        )[0];
    } catch (e) {
        const error = e as { code: string; constraint?: string };
        const FOREIGN_KEY_VIOLATION_ERROR_CODE = "23503";
        if (error?.code === FOREIGN_KEY_VIOLATION_ERROR_CODE) {
            throw new RoomDoesntExist(roomId);
        }
        throw e;
    }
}
