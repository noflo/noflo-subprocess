import { exec } from "node:child_process";
import { promisify } from "node:util";

import { Component } from "@noflo/noflo";

// The promise form of exec. At runtime callback-less exec() returns a
// Promise, but @types/node does not type that overload — promisify
// resolves to the typed __promisify__ signature instead
const execAsync = /** @type {typeof exec.__promisify__} */ (
  /** @type {unknown} */ (promisify(exec))
);

/** Default maximum duration of a command, in milliseconds */
const DEFAULT_TIMEOUT = 60000;

/**
 * Executes a shell command and sends its standard output.
 *
 * Uses the promise form of `node:child_process.exec` (level 2 on the
 * dependency ladder; process spawning has no Web-standard equivalent).
 * The promise-pure process style relies on 2.x implicit sendDone:
 * a resolved Promise sends the output map, a rejected one routes the
 * Error to the error outport.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Library to execute commands as subprocess",
    icon: "smile-o",
    inPorts: {
      command: {
        datatype: "string",
        description: "Shell command to execute",
        required: true,
      },
      timeout: {
        datatype: "int",
        description: "Maximum duration of the command in milliseconds",
        control: true,
        default: DEFAULT_TIMEOUT,
      },
    },
    outPorts: {
      out: {
        datatype: "string",
        description: "Standard output of the command",
      },
      error: {
        datatype: "object",
      },
    },
  });

  // Stream grouping on the command port carries through to both outputs,
  // so consumers can correlate a result or failure with the request
  c.forwardBrackets = { command: ["out", "error"] };

  c.process((input) => {
    if (!input.hasData("command")) {
      return;
    }
    // When a timeout connection is attached but has not delivered yet,
    // defer firing so a late timeout IIP is not missed
    if (input.attached("timeout").length && !input.hasData("timeout")) {
      return;
    }
    const command = input.getData("command");
    const timeout = input.hasData("timeout")
      ? input.getData("timeout")
      : DEFAULT_TIMEOUT;
    return execAsync(command, { timeout })
      .then(({ stdout }) => ({ out: /** @type {string} */ (stdout) }))
      .catch((err) => {
        if (err.signal === "SIGTERM") {
          throw new Error(`Command ${command} timed out`);
        }
        throw err;
      });
  });

  return c;
}
