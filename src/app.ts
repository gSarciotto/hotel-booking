import express from "express";
import { Knex } from "knex";
import createBookARoomHandler from "./useCases/bookARoom/handler";
import createGetRoomsHandler from "./useCases/getAllRooms/handler";
import createGetBookingHandler from "./useCases/getBooking/handler";
import createGetInvoiceHandler from "./useCases/getInvoice/handler";

export function startServer(db: Knex, port = 3000) {
    const app = express();

    app.use(express.json());

    app.get("/", (req, res) => {
        //delete
        console.log("hello world");
        res.status(200).send("hello world");
    });

    app.get("/room", createGetRoomsHandler(db));

    app.get("/booking", createGetBookingHandler(db));

    app.post("/booking", createBookARoomHandler(db));

    app.get("/invoice/:invoiceId", createGetInvoiceHandler(db));

    app.get("/invoice", createGetInvoiceHandler(db));

    return app.listen(port, () => {
        console.log("server started");
    });
}
