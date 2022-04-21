import knex, { Knex } from "knex";

export let db: Knex;

export async function startDatabase(
    connectionParams: Knex.Config["connection"]
): Promise<Knex> {
    db = knex({
        client: "pg",
        connection: connectionParams
    });

    await db.migrate.latest({
        directory: "src/database/migrations"
    });

    return db;
}
