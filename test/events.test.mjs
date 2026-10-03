import assert from "node:assert/strict";
import { isEventName } from "../lib/events.ts";

assert.equal(isEventName("human_visit"), true);
assert.equal(isEventName("anything_else"), false);
assert.equal(isEventName(null), false);
