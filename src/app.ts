import express from "express";
import { Knex } from "knex";
import { Booking } from "./database/models/booking";
import createBookARoomHandler from "./useCases/bookARoom/handler";
import createConfirmBookingHandler from "./useCases/confirmBooking/handler";
import createGetRoomsHandler from "./useCases/getAllRooms/handler";
import createGetBookingHandler from "./useCases/getBooking/handler";
import createGetInvoiceHandler from "./useCases/getInvoice/handler";
import { decodeToken as defaultDecodeToken } from "./utils/jwt";

export function startServer({
    db,
    port = 3000,
    decodeJwt = (token: string) => defaultDecodeToken(token, "some-secret"),
    publishNewBooking = () => Promise.resolve()
}: {
    db: Knex;
    port: number;
    decodeJwt?: <T>(token: string) => Promise<T>;
    publishNewBooking?: (newBooking: Booking) => Promise<void>;
}) {
    const app = express();

    app.use(express.json());

    app.get("/room", createGetRoomsHandler(db));

    app.get("/booking", createGetBookingHandler(db));

    app.post("/booking", createBookARoomHandler(db, publishNewBooking));

    app.get("/invoice/:invoiceId", createGetInvoiceHandler(db));

    app.get("/invoice", createGetInvoiceHandler(db));

    app.get(
        "/booking/:bookingId/confirm",
        createConfirmBookingHandler(db, decodeJwt)
    );

    return app.listen(port, () => {
        console.log("server started");
    });
}
