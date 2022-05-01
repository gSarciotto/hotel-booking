export function sendEmail(email: string, content: string): Promise<void> {
    console.log(`To: ${email}
    ${content}
    `);
    return Promise.resolve();
}
