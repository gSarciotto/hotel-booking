import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const invoicesTableExists = await knex.schema.hasTable("invoices");
    if (!invoicesTableExists) {
        await knex.schema.createTable("invoices", (table) => {
            table.uuid("id").primary();
            table.decimal("price", 10, 2).notNullable();
            table
                .uuid("bookingId")
                .notNullable()
                .unique()
                .references("id")
                .inTable("bookings");
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function down(knex: Knex): Promise<void> {}
