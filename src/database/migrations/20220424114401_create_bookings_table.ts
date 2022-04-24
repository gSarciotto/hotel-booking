import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const bookingsTableExists = await knex.schema.hasTable("bookings");
    if (!bookingsTableExists) {
        await knex.schema.createTable("bookings", (table) => {
            table.uuid("id").primary();
            table.text("email").notNullable();
            table.timestamp("bookingDate", { useTz: true }).notNullable();
            table
                .integer("roomId")
                .notNullable()
                .references("id")
                .inTable("rooms");
            // add unique constraint between the booking date and room id
            // actually might have to use a unique index because of the timestamp field
            /*
            table.unique(
                [
                    "roomId",
                    knex.raw("date_trunc('day', ??, 'GMT')", [
                        "bookings.bookingDate"
                    ])
                ],
                {
                    indexName: "room_and_booking_date_unique_index"
                }
            );
            */
        });
        /*
        await knex.raw(
            `CREATE UNIQUE INDEX room_and_booking_date_unique_index ON bookings ("roomId", date_trunc('day', "bookingDate"))`
            //["bookings.bookingDate"]
        );
        */
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function down(knex: Knex): Promise<void> {}
