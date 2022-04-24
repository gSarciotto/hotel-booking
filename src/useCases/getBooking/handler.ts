import { RequestHandler } from "express";
import { Knex } from "knex";
import { getBookings } from "./queries";

export default function createGetBookingHandler(db: Knex): RequestHandler {
    return (request, response) => {
        let emailToFilterBy: string | undefined = undefined;
        let confirmationStatusToFilterBy: boolean | undefined = undefined;
        //maybe do better validation
        if (request.query?.email && typeof request.query?.email === "string") {
            emailToFilterBy = request.query.email;
        }
        const confirmationStatusInQuery: unknown = request.query.confirmed;
        if (
            typeof confirmationStatusInQuery === "string" &&
            ["true", "false"].includes(confirmationStatusInQuery)
        ) {
            confirmationStatusToFilterBy = !!confirmationStatusInQuery;
        }
        getBookings(db, {
            email: emailToFilterBy,
            isConfirmed: confirmationStatusToFilterBy
        })
            .then((existingBookings) => {
                response.status(200).send({ bookings: existingBookings });
                // maybe do a join with room?
            })
            .catch((err) => {
                console.error(err);
                response
                    .status(500)
                    .send({ message: "Unable to get bookings" });
            });
    };
}
