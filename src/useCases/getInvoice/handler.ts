import { RequestHandler } from "express";
import { Knex } from "knex";
import { getInvoices } from "./queries";

export default function createGetInvoiceHandler(db: Knex): RequestHandler {
    return (request, response) => {
        const requestedInvoiceId: string | undefined =
            request.params?.invoiceId;
        const uuidV4Regex =
            /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
        if (
            requestedInvoiceId !== undefined &&
            !uuidV4Regex.test(requestedInvoiceId)
        ) {
            //later move this to a validation function
            response.status(400).json({ message: "Invalid invoice id format" });
            return;
        }
        getInvoices(db, requestedInvoiceId)
            .then((invoices) => {
                if (!invoices || invoices?.length === 0) {
                    response
                        .status(404)
                        .json({ message: "Requested invoice does not exist" });
                    return;
                }
                response.status(200).json({ invoices });
            })
            .catch((err) => {
                // move these general errors to a middleware
                console.error(err);
                response
                    .status(500)
                    .send({ message: "Unable to get invoices" });
            });
    };
}
