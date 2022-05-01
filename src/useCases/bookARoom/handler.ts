import { RequestHandler } from "express";
import { Knex } from "knex";
import { Booking } from "../../database/models/booking";
import { createANewBooking } from "./queries";

type NewBookingRequest = Pick<Booking, "bookingDate" | "email" | "roomId">;

export default function createBookARoomHandler(
    db: Knex,
    publishNewBooking: (newBooking: Booking) => Promise<void>
): RequestHandler {
    return (request, response) => {
        const newBookingData = request.body as NewBookingRequest;
        createANewBooking(db, newBookingData)
            .then(publishNewBooking)
            .then(() => {
                response.status(201).send();
            })
            .catch((err) => {
                if (err instanceof RoomDoesntExist) {
                    response.status(404).send({ message: err.message });
                    return;
                }
                console.error(err);
                response.status(500).send();
            });
    };
}

export class RoomDoesntExist extends Error {
    constructor(roomId: number) {
        super(`Room ${roomId} doesn't exist`);
    }
}
