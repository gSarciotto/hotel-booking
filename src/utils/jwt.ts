import { sign, verify } from "jsonwebtoken";

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

export async function signToken(
    email: string,
    jwtSecret: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        sign({ email }, jwtSecret, {}, (err, token) => {
            if (err) {
                reject(err);
            } else {
                resolve(token ? token : "");
            }
        });
    });
}
