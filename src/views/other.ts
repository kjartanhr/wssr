export function Other({
    time
}: {
    time: Date
}) {
    return (`
        <h1>other</h1>
        <p>server time at request time: ${time.toISOString()}</p>
        <a href="/">
            Get home
        </a>
        <a href="https://google.com/">
            Go to google
        </a>
    `);
}