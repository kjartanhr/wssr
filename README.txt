Kjartan Hrafnkelsson <kjh14@hi.is>

- WSSR - WebSocket Server Side Rendering

-- What is this

This is a concept for an idea I had on my way to work one day. "What if we
combined the SPA and SSR approach into one... but with WebSockets as a transport
?"

I'm pretty sure this isn't a novel idea but I had never seen anyone give it a go
in a TypeScript environment. And I had certainly not seen anyone make a
framework - or something similar - out of the concept.

That is what this repository is. It's a very primitive "framework" around this
concept.

-- In practice

Views are defined like functions - kind of like React - that get params passed
to them that you can use in the view. Since nothing is abstracted yet, these
params are completely arbitrary. To "register" the view you add it to the views
map in the `src/index.ts` file called "APP_ROUTES". There you can also pass your
params to it.

Every view is wrapped in a HTML wrapper defined in `src/views/_app.ts`. This
wrapper references a script in `src/resources/scripts` that opens a WebSocket
connection with the server on page load. When you visit any endpoint it will
check if there's a route for it and, if so, serve you the HTML for that route,
along with that script loaded by the wrapper.

This WebSocket connection is kept open for the duration of the user's visit.
Pages can now be loaded by sending a message formatted like so: `GET <route>` to
the socket. The server will respond with `HTML_CONTENT <route> <html>`. The
aforementioned script parses this reply and replaces the innerHTML of `<body>`
with the new HTML received over the socket.

This way, you can render views server-side and transport them to the client with
zero new request overhead. I found that this works seemingly pretty well if your
data is close to the server. I have not done any proper testing, though.

-- Changes to consider

- Defining routes closer to the fastify/express.js style of doing so, giving the 
  user access to the req and reply parameters.
- Attempting to reconnect the WebSocket on close, up to n attempts, to keep apps
  working even after a connection reset.

-- Disclaimer

I don't think the code I've written is "good". I won't claim to know the
effectiveness of the approach I have here, nor the drawbacks of it. I think this
is a cool proof of concept. Depending on feedback I may continue work on this
little project. At the end of the day I just felt like playing with WebSockets.

-- License

This codebase is hereby, and as shown in the `LICENSE` file, licensed under MIT.
Not because I think anyone will use it but because there is no reason for it to
be my exclusive intellectual property.