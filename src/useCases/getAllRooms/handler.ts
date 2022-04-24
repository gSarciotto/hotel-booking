import { RequestHandler } from "express";
import { Knex } from "knex";
import { getAllRooms } from "./queries";

export default function createGetRoomsHandler(db: Knex): RequestHandler {
    return (_, response) => {
        getAllRooms(db)
            .then((rooms) => {
                response.status(200).json({ rooms });
            })
            .catch((err) => {
                console.error(err);
                response.status(500).json({ message: "Unable to get rooms" });
            });
    };
}
