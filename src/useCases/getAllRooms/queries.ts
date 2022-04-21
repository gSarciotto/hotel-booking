import { Knex } from "knex";
import { Room } from "../../database/models/room";

export async function getAllRooms(db: Knex): Promise<Pick<Room, "name">> {
    return db<Room>("rooms").select("name");
}
