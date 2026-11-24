import { readFile } from 'node:fs/promises';

// Emit SQL for psql. Hex encoding keeps source text out of SQL syntax.
const data = new URL('../data/recruitment/', import.meta.url);
const filenames = ['journalism-general-v1.json', 'journalism-sources-v1.json'];
const files = process.argv.slice(2);
if (files.length !== 0 && files.length !== 2) {
  console.error('Provide both the candidate seed and the source index, or neither.');
  process.exit(1);
}

const inputs = await Promise.all((files.length ? files : filenames.map(name => new URL(name, data)))
  .map(file => readFile(file, 'utf8')));
const argumentsSql = inputs.map(input => {
  const hex = Buffer.from(JSON.stringify(JSON.parse(input))).toString('hex');
  return `convert_from(decode('${hex}', 'hex'), 'UTF8')::jsonb`;
});
console.log(`SELECT recruitment.import_batch(${argumentsSql.join(', ')});`);
