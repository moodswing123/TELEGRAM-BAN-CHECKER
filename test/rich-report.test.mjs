import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRichReport, richReportPayload } from '../src/rich-report.mjs';

test('builds a structured rich report with a bordered table', () => {
  const result = {
    phone: '+2348131225323', phoneCountry: '🇳🇬 Nigeria', banned: true,
    banType: 'permanent', banDate: 1759005365, banTime: 1759005365,
    violationType: '14', reason: 'Type 14', canAppeal: 'NO',
    appealStatus: 'BANNED', appealTime: 1759005389,
  };
  const rich = buildRichReport(result, 'V-BAN-CHECKER', 'Powered by Victory Tech™');
  assert.equal(rich.blocks[0].type, 'heading');
  assert.equal(rich.blocks[2].type, 'table');
  assert.equal(rich.blocks[2].is_bordered, true);
  assert.equal(rich.blocks[2].is_striped, true);
  assert.equal(rich.blocks[2].cells.length, 12);
  assert.equal(rich.blocks[2].cells[0][0].is_header, true);
  assert.equal(rich.blocks[2].cells.slice(1).flat().every((cell) => cell && typeof cell === 'object' && !Array.isArray(cell)), true);
  assert.equal(rich.blocks[2].cells[1][1].text.type, 'code');
  assert.equal(rich.blocks[2].cells[5][1].text.type, 'date_time');
});

test('wraps the report in a sendRichMessage payload', () => {
  const payload = richReportPayload(123, { phone: '+12345678901', phoneCountry: 'NORTH AMERICA', banned: false, banType: 'NOT APPLICABLE', violationType: 'NOT APPLICABLE', reason: 'NOT APPLICABLE', canAppeal: 'NOT APPLICABLE', appealStatus: 'NOT APPLICABLE' }, 'V-BAN-CHECKER', 'Powered by Victory Tech™');
  assert.equal(payload.chat_id, 123);
  assert.equal(Array.isArray(payload.rich_message.blocks), true);
});
