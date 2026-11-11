import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execute } from '../src/services/execution';
test('simulação usa regras locais, gera registros e não acessa a rede', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Rede não permitida na simulação'); };
  try {
    const event = { id: 'evt-002', type: 'PedidoCriado', source: 'loja.checkout', data: { pedidoId: 'P-002', total: 300 } };
    const success = await execute(event, 'simulation');
    assert.equal(success.result?.totalFinal, 270);
    assert.equal(success.logs.length, 3);
    assert.ok(success.durationMs >= 0);
    const invalid = await execute({ ...event, data: { total: 150 } }, 'simulation');
    assert.match(invalid.error!, /pedidoId/);
    assert.equal(invalid.result, undefined);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});
