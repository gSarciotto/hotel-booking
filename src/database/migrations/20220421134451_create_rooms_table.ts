import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const roomsTableExists = await knex.schema.hasTable("rooms");
    if (!roomsTableExists) {
        await knex.schema.createTable("rooms", (table) => {
            table.increments("id").primary();
            table.text("name");
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function down(knex: Knex): Promise<void> {}
