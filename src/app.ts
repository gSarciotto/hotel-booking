import express from "express";
import { Knex } from "knex";
import createBookARoomHandler from "./useCases/bookARoom/handler";
import createGetRoomsHandler from "./useCases/getAllRooms/handler";

export function startServer(db: Knex, port = 3000) {
    const app = express();

    app.use(express.json());

    app.get("/", (req, res) => {
        //delete
        console.log("hello world");
        res.status(200).send("hello world");
    });

    app.get("/room", createGetRoomsHandler(db));

    app.post("/booking", createBookARoomHandler(db));

    return app.listen(port, () => {
        console.log("server started");
    });
}
