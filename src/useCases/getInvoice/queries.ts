import { Knex } from "knex";
import { Invoice } from "../../database/models/invoice";

export async function getInvoices(
    db: Knex,
    invoiceId?: string
): Promise<Invoice[]> {
    let query = db<Invoice>("invoices").select("*");
    if (invoiceId) {
        query = query.where("id", invoiceId);
    }
    return query;
}
