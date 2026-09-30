import test from 'node:test';
import assert from 'node:assert/strict';
import { currentSchoolYear } from '../src/store.js';
test('school year changes in September', () => {
  assert.equal(currentSchoolYear(new Date('2026-08-31')), '2025/26');
  assert.equal(currentSchoolYear(new Date('2026-09-01')), '2026/27');
});
