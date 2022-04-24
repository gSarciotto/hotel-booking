import { RequestHandler } from "express";
import { Knex } from "knex";
import { Booking } from "../../database/models/booking";
import { createANewBooking } from "./queries";

type NewBookingRequest = Pick<Booking, "bookingDate" | "email" | "roomId">;

export default function createBookARoomHandler(db: Knex): RequestHandler {
    return (request, response) => {
        //validate -> query for the room?
        const newBookingData = request.body as NewBookingRequest;
        createANewBooking(db, newBookingData)
            .then(() => {
                response.status(201).send();
            })
            .catch((err) => {
                if (err instanceof RoomDoesntExist) {
                    response.status(404).send({ message: err.message });
                }
                console.error(err);
                response.status(500).send();
            });
        // publish to a queue to do the confirmation email?
    };
}

export class RoomDoesntExist extends Error {
    constructor(roomId: number) {
        super(`Room ${roomId} doesn't exist`);
    }
}
