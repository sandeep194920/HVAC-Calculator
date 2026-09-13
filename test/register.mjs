/** Registers the path-alias resolver for `node --test`. */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./resolver.mjs", pathToFileURL("./test/"));
