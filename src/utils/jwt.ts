import { verify } from "jsonwebtoken";

export function decodeToken<PayloadType>(
    token: string,
    secret: string
): Promise<PayloadType> {
    return new Promise((resolve, reject) => {
        verify(token, secret, {}, (err, decoded) => {
            if (err) {
                reject(err);
            }
            resolve(decoded as PayloadType);
        });
    });
}

export type DecodeTokenFunction = typeof decodeToken;
