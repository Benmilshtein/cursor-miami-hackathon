import { createServer as createHttps } from "node:https";
import { createServer as createHttp } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { parse } from "node:url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
await app.prepare();

const keyPath = process.env.SSL_KEY_PATH;
const certPath = process.env.SSL_CERT_PATH;
const useHttps = keyPath && certPath && existsSync(keyPath) && existsSync(certPath);

const requestHandler = async (req, res) => {
  const parsedUrl = parse(req.url, true);
  await handle(req, res, parsedUrl);
};

if (useHttps) {
  createHttps({ key: readFileSync(keyPath), cert: readFileSync(certPath) }, requestHandler).listen(
    port,
    hostname,
    () => console.log(`> Ready on https://${hostname}:${port}`)
  );
} else {
  createHttp(requestHandler).listen(port, hostname, () =>
    console.log(`> Ready on http://${hostname}:${port}`)
  );
}
