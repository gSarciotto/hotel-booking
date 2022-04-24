import { Knex } from "knex";
import { Booking } from "../../database/models/booking";

export async function getBookings(
    db: Knex,
    filters: {
        email?: Booking["email"];
        isConfirmed?: Booking["isConfirmed"];
    } = {}
): Promise<Booking[]> {
    let query = db<Booking>("bookings").select("*");
    if (filters.email) {
        query = query.where({ email: filters.email });
    }
    if (filters.isConfirmed !== undefined) {
        query = query.andWhere({ isConfirmed: filters.isConfirmed });
    }
    return query;
}
