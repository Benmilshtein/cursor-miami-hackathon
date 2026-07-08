import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  console.log("[startup] Running database migrations");
  await run("npm", ["run", "db:migrate"]);
  console.log("[startup] Migrations complete - starting Next.js server");
  await run("node", ["server.js"]);
}

main().catch((error) => {
  console.error("[startup] Fatal startup error", error);
  process.exit(1);
});
