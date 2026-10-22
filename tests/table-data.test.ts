import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTableData } from '../services/tableData.ts';

test('valid local tables keep their rows and need no provider configuration', () => {
  const rows = [{name: 'Ada', interests: ['maths', 'music'], detail: {year: 1843}}];
  const table = validateTableData({columns: [{key: 'name', label: 'Name'}], data: rows, apiKey: 'SHOULD_NOT_APPEAR'});
  assert.deepEqual(table.data, rows); assert.equal('apiKey' in table, false);
});

test('malformed columns and rows fail before rendering', () => {
  for (const value of [null, {columns: 'name', data: []}, {columns: [{key: 'a', label: 'A'}, {key:'a',label:'Again'}],data:[]}, {columns:[],data:[null]}, {columns:[],data:[],suggestedTitle:{}}]) assert.throws(() => validateTableData(value), /Invalid table/);
});
