import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as noflo from "@noflo/noflo";

import { getComponent } from "../components/Execute.js";

/**
 * Waits for the next IP on a socket matching the predicate.
 *
 * Note: the IPs of one activation arrive on an edge as a single
 * synchronous burst, so wait for the terminating event (the closing
 * bracket) and then assert on the collected sequence instead of
 * chaining per-event listeners.
 * @param {import("@noflo/noflo").internalSocket.InternalSocket} socket
 * @param {(ip: import("@noflo/noflo").IP) => boolean} predicate
 * @returns {Promise<import("@noflo/noflo").IP>}
 */
const waitUntil = (socket, predicate) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for IP"));
    }, 5000);
    /** @param {CustomEvent} event */
    const listener = (event) => {
      const ip = event.detail;
      if (predicate(ip)) {
        cleanup();
        resolve(ip);
      }
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.removeEventListener("ip", listener);
    };
    socket.addEventListener("ip", listener);
  });

/**
 * Collects every IP arriving on a socket.
 * @param {import("@noflo/noflo").internalSocket.InternalSocket} socket
 * @returns {import("@noflo/noflo").IP[]}
 */
const collect = (socket) => {
  /** @type {import("@noflo/noflo").IP[]} */
  const ips = [];
  socket.addEventListener(
    "ip",
    /** @param {CustomEvent} event */ (event) => {
      ips.push(event.detail);
    },
  );
  return ips;
};

/**
 * Sends a grouped command: openBracket, data, closeBracket.
 * @param {import("@noflo/noflo").internalSocket.InternalSocket} socket
 * @param {string} group
 * @param {string} command
 */
const sendGrouped = (socket, group, command) => {
  socket.post(new noflo.IP("openBracket", group));
  socket.post(new noflo.IP("data", command));
  socket.post(new noflo.IP("closeBracket", group));
};

// fbp-spec covers data behavior (command output, error messages, timeout).
// Group forwarding is not expressible in fbp-spec v1, so it is covered here.
describe("Execute component grouping", () => {
  it("forwards the command grouping to out on success", async () => {
    const c = getComponent();
    const command = noflo.internalSocket.createSocket();
    const out = noflo.internalSocket.createSocket();
    const error = noflo.internalSocket.createSocket();
    c.inPorts.command.attach(command);
    c.outPorts.out.attach(out);
    c.outPorts.error.attach(error);
    const outIps = collect(out);
    const errorIps = collect(error);

    try {
      sendGrouped(command, "send-command", "printf hello");
      // Wait for the stream to close, then assert the full sequence
      await waitUntil(out, (ip) => ip.type === "closeBracket");

      assert.deepEqual(
        outIps.map((ip) => [ip.type, ip.data]),
        [
          ["openBracket", "send-command"],
          ["data", "hello"],
          ["closeBracket", "send-command"],
        ],
      );
      assert.deepEqual(
        errorIps.filter((ip) => ip.type === "data" || ip.type === "error"),
        [],
      );
    } finally {
      await c.shutdown();
    }
  });

  it("forwards the command grouping to error on failure, with no data on out", async () => {
    const c = getComponent();
    const command = noflo.internalSocket.createSocket();
    const out = noflo.internalSocket.createSocket();
    const error = noflo.internalSocket.createSocket();
    c.inPorts.command.attach(command);
    c.outPorts.out.attach(out);
    c.outPorts.error.attach(error);
    const outIps = collect(out);
    const errorIps = collect(error);

    try {
      sendGrouped(
        command,
        "send-command",
        "noflo-subprocess-nonexistent-command-xyz",
      );
      // Wait for the error stream to close, then assert
      await waitUntil(error, (ip) => ip.type === "closeBracket");

      const errorIp = errorIps.find(
        (ip) => ip.type === "data" || ip.type === "error",
      );
      assert.ok(errorIp, "expected an error IP on the error port");
      assert.ok(errorIp.data instanceof Error);
      // Forwarded brackets attach to actual sends: on failure only the
      // error path receives the grouping, out stays completely silent
      assert.deepEqual(outIps, []);
    } finally {
      await c.shutdown();
    }
  });
});
