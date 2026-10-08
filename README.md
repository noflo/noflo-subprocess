# @noflo/subprocess

NoFlo library to execute commands as a sub-process.

## Components

- `subprocess/Execute` — executes a shell command and sends its standard output

## Usage

Components are discovered automatically by NoFlo 2.x on Node.js. Wire `subprocess/Execute` into your graph and send a shell command to the `command` port:

- `command` (string): shell command to execute
- `timeout` (int, control, default `60000`): maximum duration of the command in milliseconds
- `out` (string output): standard output of the command
- `error` (object output): failures, including commands that cannot be found or that exceed the timeout

Example in FBP:

```
ReadSkeleton(Subprocess/Execute) OUT -> IN Display
'ls -lah' -> COMMAND ReadSkeleton
```

## Development

Install dependencies and run the test suite:

```
npm ci
npm test
```
