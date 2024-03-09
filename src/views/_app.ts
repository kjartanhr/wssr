export function App({
    children
}: {
    children: string
}) {
    return (`
        <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>A WSSR app</title>
                <script src="/resources/scripts/app-ws-handler.dist.js" defer></script>
            </head>
            <body>
                ${children}
            </body>
        </html>
    `);
}