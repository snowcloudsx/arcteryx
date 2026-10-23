import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { routeRequest, routeUpgrade } = await bootstrap();

const app = express();

const sessions = new Map();

app.get("/api/users", (req, res) => {
	const sid = (req.query && req.query.sid) ? String(req.query.sid) : null;
	const now = Date.now();
	if (sid) sessions.set(sid, now);
	for (const [k, v] of sessions) {
		if (now - v > 15000) sessions.delete(k);
	}
	res.json({ count: sessions.size });
});

app.use((req, res, next) => {
	if (routeRequest(req, res)) return;
	next();
});
app.get("/g", (req, res) => res.sendFile(path.join(__dirname, "public", "g.html")));
app.get("/m", (req, res) => res.sendFile(path.join(__dirname, "public", "m.html")));
app.get("/r", (req, res) => res.sendFile(path.join(__dirname, "public", "r.html")));
app.get("/s", (req, res) => res.sendFile(path.join(__dirname, "public", "s.html")));
app.get("/v", (req, res) => res.sendFile(path.join(__dirname, "public", "v.html")));
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

server.on("upgrade", routeUpgrade);

const port = process.env.PORT || 8080;
server.listen(port, () => {
	console.log("Server is running on port " + port);
});
