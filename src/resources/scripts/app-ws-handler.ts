const socket = new WebSocket(`ws://${window.location.hostname}:3000/`);

interface SocketState {
    open: boolean,
    confirmed: boolean
}

let socketState: SocketState = {
    open: false,
    confirmed: false
};

type ListenerEvent = 'openConfirm' | 'content' | 'close';

interface Listeners {
    openConfirm: (() => void)[],
    content: (() => void)[],
    close: (() => void)[]
}

let listeners: Listeners = {
    openConfirm: [],
    content: [],
    close: []
}

function addSocketEventListener(
    event: ListenerEvent,
    method: () => void
) {
    let currentListeners = listeners[event];

    currentListeners.push(method);

    listeners[event] = currentListeners;
}

function callEventListeners(
    ...events: ListenerEvent[]
) {
    events.forEach(event => {
        listeners[event].forEach(listener => listener());
    });
}

socket.addEventListener('open', () => {
    socketState.open = true;

    socket.send('OPEN_SENT');

    console.log('wssr-send', 'OPEN_SENT');
});

socket.addEventListener('message', async (event) => {
    const data: string = await event.data.text();

    if (data === 'OPEN_CONFIRM') {
        socketState.confirmed = true;

        callEventListeners('openConfirm');

        console.log('wssr-receive', 'OPEN_CONFIRM');
    }

    if (data.startsWith('HTML_CONTENT')) {
        const route = data.split(' ')[1];
        const html = data.split(' ').slice(2).join(' ');

        document.body.innerHTML = html;
        history.pushState(null, "", route);

        callEventListeners('content');

        console.log('wssr-receive', 'HTML_CONTENT', 'route', route);
    }
});

socket.addEventListener('close', () => {
    socketState.open = false;
    socketState.confirmed = false;

    callEventListeners('close');

    console.log('wssr-receive', 'close');
});

socket.addEventListener('error', (event) => {
    console.error('wssr-receive', 'error,', 'event:',event);
})

function handleGet(
    event: Event
) {
    event.preventDefault();

    const isButton = event.currentTarget instanceof HTMLButtonElement;
    const isAnchor = event.currentTarget instanceof HTMLAnchorElement;
    const isInput = event.currentTarget instanceof HTMLInputElement;

    function getRoute() {
        const {
            protocol: proto,
            hostname: host,
            port
        } = window.location;

        const PORT_IS_NONSTANDARD = port !== "443" && port !== "80";

        if (isAnchor) {
            return event.currentTarget.href.replace(
                `${proto}//${host}${PORT_IS_NONSTANDARD ? `:${port}` : ''}`,
                ''
            );
        }

        if (isButton || isInput) {
            return event.currentTarget.dataset.get;
        }
    }

    if (
        !(isButton) &&
        !(isAnchor) &&
        !(isInput)
    ) {
        return;
    }

    const route = getRoute();
    socket.send(`GET ${route}`);

    console.log('wssr-send', 'GET');
    return;
}


const GETTERS_SELECTOR = 'button[data-get], input[type="button"][data-get], a[href]';
function overrideClicks() {
    const getters = document.querySelectorAll(GETTERS_SELECTOR);

    getters.forEach(getter => {
        if (getter instanceof HTMLAnchorElement && !getter.href.startsWith(`${window.location.protocol}//${window.location.hostname}`)) {
            return;
        }

        getter.addEventListener('click', handleGet);
    });
}

function undoClickOverride() {
    const getters = document.querySelectorAll(GETTERS_SELECTOR);
    
    getters.forEach(getter => {
        getter.removeEventListener('click', handleGet);
    });
}

addSocketEventListener('openConfirm', overrideClicks);
addSocketEventListener('content', overrideClicks);
addSocketEventListener('close', undoClickOverride);

function wsfetch(
    url: string,
    init: RequestInit
) {
    if (
        url.startsWith('https://') ||
        url.startsWith('http://') ||
        !socketState.confirmed
    ) {
        return httpfetch(url, init);
    }

    if (!init) init = {};
    if (!init.method) init.method = 'GET';

    console.log('wssr-fetch', 'sending', init.method, 'to', url);
}

const httpfetch = fetch;

/* @ts-ignore we know what we're doing... it's cursed but we know what we're doing. */
fetch = wsfetch;