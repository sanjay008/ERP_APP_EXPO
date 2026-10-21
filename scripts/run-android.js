#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");

function adbPath() {
  const sdk =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    path.join(process.env.HOME || "", "Library/Android/sdk");
  return path.join(sdk, "platform-tools", "adb");
}

function runAdb(args) {
  return spawnSync(adbPath(), args, { encoding: "utf8" });
}

function parseDevices(output) {
  return output
    .split(/\r?\n/)
    .map((line) =>
      line.match(
        /^(.*?)\s+(device|offline|unauthorized|no permissions|authorizing)(?:\s+(.*))?$/
      )
    )
    .filter(Boolean)
    .map((match) => ({
      pid: match[1].trim(),
      state: match[2],
    }))
    .filter((item) => item.pid && item.pid !== "List");
}

function parseMdnsServices(output) {
  return output
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/(\d+\.\d+\.\d+\.\d+:\d+)\s*$/);
      if (!match || !line.includes("_adb-tls-connect._tcp")) return null;
      return {
        name: line.replace(/\t_adb-tls-connect\._tcp.*/, "").trim(),
        address: match[1],
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.name.includes("(2)")) - Number(a.name.includes("(2)")));
}

function stabilizeWireless() {
  const mdns = runAdb(["mdns", "services"]);
  const services = parseMdnsServices(mdns.stdout || "");
  for (const service of services) {
    const result = runAdb(["connect", service.address]);
    const text = `${result.stdout || ""}${result.stderr || ""}`;
    if (/connected to|already connected/i.test(text)) {
      console.log(`Connected wireless ADB at ${service.address}`);
    }
  }

  const listed = runAdb(["devices", "-l"]);
  for (const device of parseDevices(listed.stdout || "")) {
    if (
      device.pid.includes("_adb-tls-connect.") ||
      (device.pid.startsWith("adb-") && device.pid.includes(" "))
    ) {
      runAdb(["disconnect", device.pid]);
    }
  }
}

runAdb(["start-server"]);
stabilizeWireless();

const listed = runAdb(["devices", "-l"]);
const devices = parseDevices(listed.stdout || "");
const ready = devices.filter((item) => item.state === "device");

if (!ready.length) {
  console.error("No authorized Android device is attached to ADB.");
  console.error("");
  console.error("Connect first, then rerun npm run android:");
  console.error("  USB:  enable USB debugging and plug in the phone");
  console.error("  Wi-Fi: Wireless debugging on, same Wi-Fi as this Mac");
  console.error("");
  if (listed.stdout) process.stderr.write(listed.stdout);
  process.exit(1);
}

const preferred =
  ready.find((item) => /^\d+\.\d+\.\d+\.\d+:\d+$/.test(item.pid)) || ready[0];

const result = spawnSync(
  "npx",
  ["expo", "run:android", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ANDROID_SERIAL: preferred.pid,
    },
  }
);
process.exit(result.status ?? 1);
