// lowercase-columns.js
// Usage: node lowercase-columns.js input.sql output.sql
const fs = require("fs");

const inPath = process.argv[2] || "fallback-schema.sql";
const outPath = process.argv[3] || inPath.replace(/(\.sql)?$/i, ".lower.sql");

const src = fs.readFileSync(inPath, "utf8");
const lines = src.split(/\r?\n/);

let inCreate = false;

const out = lines
  .map((line) => {
    // Enter a CREATE TABLE block
    if (/^\s*CREATE\s+TABLE\s+"[^"]+"\s*\(/i.test(line)) {
      inCreate = true;
      return line; // do NOT change table name
    }
    // Exit at the closing parenthesis + semicolon
    if (inCreate && /^\s*\);\s*$/.test(line)) {
      inCreate = false;
      return line;
    }
    // Inside CREATE TABLE: lowercase the first quoted identifier (the column name)
    if (inCreate) {
      return line.replace(
        /^(\s*)"([^"]+)"/,
        (_, sp, col) => `${sp}"${col.toLowerCase()}"`
      );
    }
    return line;
  })
  .join("\n");

fs.writeFileSync(outPath, out, "utf8");
console.log(`Wrote: ${outPath}`);
