import { RequestHandler } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { Knex } from "knex";
import { Booking } from "../../database/models/booking";
import { confirmBookingAndCreateInvoice } from "./queries";

export default function createConfirmBookingHandler(
    db: Knex,
    decodeToken: <T>(token: string) => Promise<T>
): RequestHandler {
    return (request, response) => {
        const bookingId: string | undefined = request.params?.bookingId;
        const uuidV4Regex =
            /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
        if (bookingId !== undefined && !uuidV4Regex.test(bookingId)) {
            //later move this to a validation function
            response.status(400).json({ message: "Invalid booking id format" });
            return;
        }
        const token = request.query?.token;
        if (typeof token !== "string") {
            response.status(400).json({ message: "Request is missing token" });
        }

        decodeToken<{ email?: string }>(token as string)
            .then((decodedToken) => {
                if (!decodedToken.email) {
                    response.status(400).json({ message: "Invalid token" });
                    return;
                }
                return confirmBookingAndCreateInvoice(db, {
                    bookingId,
                    price: 100
                });
            })
            .then(() => {
                response.status(200).send();
            })
            .catch((err) => {
                if (err instanceof TokenExpiredError) {
                    response.status(403).send({ message: "Invalid token" });
                    return;
                }
                if (err instanceof BookingDoesntExist) {
                    response.status(404).send({
                        message:
                            "Requested booking to be confirmed does not exist"
                    });
                    return;
                }
                console.error(err);
                response
                    .status(500)
                    .send({ message: "Unable to confirm booking" });
            });
    };
}

export class BookingDoesntExist extends Error {
    constructor(bookingId: Booking["id"]) {
        super(`Booking ${bookingId} does not exist`);
    }
}
