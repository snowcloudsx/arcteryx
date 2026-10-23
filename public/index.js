const form = document.getElementById("main-form");
const address = document.getElementById("address-input");
const frameWrapper = document.getElementById("frame-wrapper");
const frameElement = document.getElementById("frame");
const frameUrl = document.getElementById("frame-url");
const error = document.getElementById("error-msg");
const errorCode = document.getElementById("error-code");

let controller;
let frame;

function getSettings() {
	let transport = "libcurl";
	let protocol = "auto";
	let wispUrl = "";
	try {
		transport = localStorage.getItem("proxy_transport") || transport;
		protocol = localStorage.getItem("proxy_protocol") || protocol;
		wispUrl = localStorage.getItem("proxy_wisp") || wispUrl;
	} catch (e) {}
	return { transport, protocol, wispUrl };
}

function buildWispPath() {
	const s = getSettings();
	let proto = s.protocol;
	if (proto === "auto") {
		proto = location.protocol === "https:" ? "wss" : "ws";
	}
	let host = location.host;
	let path = "/wisp/";
	if (s.wispUrl) {
		try {
			const u = new URL(s.wispUrl);
			host = u.host;
			path = u.pathname || "/wisp/";
			proto = u.protocol.replace(":", "");
		} catch (e) {}
	}
	return `${proto}://${host}${path}`;
}

async function init() {
	const s = getSettings();
	const wispPath = buildWispPath().replace(/^wss?:\/\//, "/").replace(/^[^/]*\//, "/"); // keep path only
	// Actually wispPath in config is the path on same origin; for custom host we can't. Keep default /wisp/
	controller = await initBootstrap({
		config: {
			transport: s.transport,
			wispPath: "/wisp/",
		},
	});

	const cachePlugin = new $scramjetUtils.HttpCachePlugin();
	const urlWatcher = new $scramjetUtils.UrlWatcherPlugin((url) => {
		frameUrl.textContent = url;
	});
	const catchEscapedLinks = new $scramjetUtils.CatchEscapedLinksPlugin(
		(url) => new URL(`/?goto=${encodeURIComponent(url.href)}`, location.origin)
	);

	frame = controller.createFrame(frameElement, {
		plugins: [cachePlugin, urlWatcher, catchEscapedLinks],
	});
}

function showErrorScreen(err, details) {
	frameWrapper.style.display = "none";
	error.textContent = err;
	errorCode.textContent = details;
}

async function navigate(input) {
	if (!frame || !controller) {
		await init();
	}
	const searchEngine = document.getElementById("search-engine").value;
	const url = search(input, searchEngine);
	await frame.go(url);
	frameWrapper.style.display = "flex";
}

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	try {
		await navigate(address.value);
	} catch (err) {
		showErrorScreen(err.message, err.stack);
	}
});

const goto = new URL(location.href).searchParams.get("goto");
if (goto) {
	history.replaceState(null, "", location.pathname);
	address.value = goto;
	navigate(goto).catch((err) => showErrorScreen(err.message, err.stack));
}

// Live user count
try {
	let sid = sessionStorage.getItem("sid");
	if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now(); sessionStorage.setItem("sid", sid); }
	const el = document.getElementById("user-count");
	function pollUsers() {
		fetch("/api/users?sid=" + encodeURIComponent(sid))
			.then((r) => r.json())
			.then((d) => { if (el) el.textContent = d.count; })
			.catch(() => {});
	}
	pollUsers();
	setInterval(pollUsers, 5000);
} catch (e) {}
