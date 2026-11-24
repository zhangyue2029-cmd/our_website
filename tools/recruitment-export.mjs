// Read the JSON result from db/recruitment/export_active.sql.
let input = '';
for await (const chunk of process.stdin.setEncoding('utf8')) input += chunk;
if (!input.trim()) throw new Error('No active recruitment release to export.');
const { version, requirements } = JSON.parse(input);
if (typeof version !== 'string' || !Array.isArray(requirements) || requirements.length === 0) {
  throw new Error('Invalid recruitment release.');
}

const careers = Object.create(null);
for (const { id, careerId, category, summary } of requirements) {
  (careers[careerId] ??= []).push({ id, category, summary });
}
const snapshot = JSON.stringify({ version, careers }, null, 2);
process.stdout.write('// Generated from the active recruitment release.\nexport const recruitmentReference = ' + snapshot + ';\n');
