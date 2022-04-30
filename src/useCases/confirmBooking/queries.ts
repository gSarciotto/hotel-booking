import { Knex } from "knex";
import { v4 } from "uuid";
import { Booking } from "../../database/models/booking";
import { Invoice } from "../../database/models/invoice";
import { BookingDoesntExist } from "./handler";

export async function confirmBookingAndCreateInvoice(
    db: Knex,
    invoice: Parameters<typeof createInvoice>[1]
): Promise<void> {
    await db.transaction(async (trx) => {
        await confirmBooking(trx, invoice.bookingId);
        await createInvoice(trx, invoice);
    });
}

async function confirmBooking(db: Knex, bookingId: Booking["id"]) {
    const updatedRows = await db<Booking>("bookings")
        .update("isConfirmed", true)
        .where("id", bookingId)
        .returning("*");
    if (updatedRows.length === 0) {
        throw new BookingDoesntExist(bookingId);
    }
}

function createInvoice(
    db: Knex,
    invoice: { price: number } & Pick<Invoice, "bookingId">
) {
    return db<Invoice>("invoices")
        .insert({
            id: v4(),
            price: invoice.price.toFixed(2),
            bookingId: invoice.bookingId
        })
        .onConflict()
        .ignore();
}
