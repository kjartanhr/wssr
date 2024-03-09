import Fastify, { FastifyInstance } from "fastify";
import "@fastify/websocket"; // import for types
import "@fastify/static";    // import for types
import { minify } from "@minify-html/node";
import { join } from "path";
import { App } from "@/views/_app";
import { Home } from "@/views/home";
import { Other } from "@/views/other";

const fastify: FastifyInstance = Fastify({
    logger: true
});

fastify.register(require('@fastify/websocket'), {
    options: { maxPayload: 1048576 }
});

fastify.register(require('@fastify/static'), {
    root: join(__dirname, 'resources'),
    prefix: '/resources/'
});

type AppRoutes = Record<string, () => string>;

const APP_ROUTES: AppRoutes = {
    '/': () => Home(),
    '/other': () => {
        const time = new Date();

        return Other({
            time
        });
    }
} as const;

function min(
    html: string
) {
    return minify(Buffer.from(html), {});
}

function wrap(
    html: string
) {
    return min(App({
        children: html
    }))
}

fastify.register(async () => {
    fastify.route({
        method: 'GET',
        url: '/*',
        handler: (req, reply) => {
            const html = APP_ROUTES[req.url];

            if (!html) {
                return reply.code(404).send({error: 404});
            }

            reply.type('text/html').send(wrap(html()));
        },
        wsHandler: (conn, req) => {
            conn.setEncoding('utf8')

            conn.on('data', (chunk) => {
                if (chunk === 'OPEN_SENT') {
                    conn.write('OPEN_CONFIRM')
                }

                const chunkSplit: Array<string> = chunk.split(' ');

                if (chunkSplit[0] === 'GET') {
                    (() => {
                        const route: string = chunkSplit.slice(1).join(' ');
                        const html = APP_ROUTES[route];

                        if (!html) {
                            return conn.write('ERR_404');
                        }

                        return conn.write(`HTML_CONTENT ${route} ${min(html())}`);
                    })();
                }
            })
        }
    })
})

fastify.listen({ port: 3000 }, err => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
});