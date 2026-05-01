import { analyzeTraces } from './analyzer.js';
import { buildDebugView } from './debug.js';
import { selectAccount, updateAccountAfterRun } from './matrix.js';
import { createDraft } from './publish/draft.js';
import { publishToX } from './publish/x.js';
import { evaluateRisk, hashContent } from './risk.js';
import { appendError, getErrors, getHistory, getMatrix, getQueue, getSettings, getTrace, saveTrace, setMatrix } from './state.js';

function json(data, status = 200) { return new Response(JSON.stringify(data, null, 2), { status, headers: { 'content-type': 'application/json' } }); }
function addStep(trace, name, start) { trace.steps.push({ name, durationMs: Date.now() - start }); }

async function runJob(env, payload = {}, replay = false, dryRun = false) {
  const trace = { traceId: crypto.randomUUID(), startedAt: new Date().toISOString(), mode: 'semi-auto', steps: [], status: 'running', errors: [], replay, dryRun };
  const history = await getHistory(env.AGENT_KV);
  const settings = await getSettings(env.AGENT_KV);
  const matrix = await getMatrix(env.AGENT_KV);

  try {
    let t = Date.now();
    const content = payload.content || { text: `Auto content ${trace.traceId.slice(0, 8)}` };
    addStep(trace, 'generate', t);

    t = Date.now();
    const account = selectAccount(matrix, payload.platform || 'x');
    if (!account) throw new Error('no_available_account');
    trace.accountId = account.id;
    trace.platform = account.platform;
    addStep(trace, 'select', t);

    t = Date.now();
    const risk = evaluateRisk({ content, history, settings });
    trace.risk = risk;
    addStep(trace, 'risk', t);
    if (!risk.pass) throw new Error('risk_blocked');

    if (trace.mode === 'semi-auto' && !payload.confirmed) throw new Error('manual_confirmation_required');

    t = Date.now();
    let publishResult;
    if (dryRun) {
      publishResult = { mode: 'dry-run', result: { text: content.text } };
    } else if (account.platform === 'x') {
      publishResult = await publishToX(content, env);
    } else {
      publishResult = await createDraft(account.platform, content);
    }
    trace.publish = publishResult;
    addStep(trace, 'publish', t);

    t = Date.now();
    trace.score = { quality: 0.9, riskPenalty: trace.risk.reasons.length * 0.1 };
    addStep(trace, 'score', t);

    trace.status = 'success';
    trace.contentHash = hashContent(content.text);

    const updatedMatrix = updateAccountAfterRun(matrix, account.id, true);
    await setMatrix(env.AGENT_KV, updatedMatrix);
  } catch (error) {
    trace.status = 'failed';
    trace.errors.push(error.message);
    await appendError(env.AGENT_KV, { traceId: trace.traceId, message: error.message, at: new Date().toISOString() });
  } finally {
    trace.finishedAt = new Date().toISOString();
    await saveTrace(env.AGENT_KV, trace);
  }
  return trace;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return Response.redirect(url.origin + '/public/index.html', 302);
    if (url.pathname.startsWith('/public/')) return env.ASSETS.fetch(request);

    if (url.pathname === '/api/run' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      return json(await runJob(env, payload));
    }

    if (url.pathname === '/api/trace') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'missing id' }, 400);
      const trace = await getTrace(env.AGENT_KV, id);
      return trace ? json(trace) : json({ error: 'not found' }, 404);
    }

    if (url.pathname === '/api/debug') {
      const [history, errors, queue] = await Promise.all([getHistory(env.AGENT_KV), getErrors(env.AGENT_KV), getQueue(env.AGENT_KV)]);
      return json(buildDebugView({ traces: history, errors, queue }));
    }

    if (url.pathname === '/api/traces') {
      const history = await getHistory(env.AGENT_KV);
      return json({ traces: history.slice(0, 100) });
    }

    if (url.pathname === '/api/replay' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      return json(await runJob(env, payload, true, payload.dryRun === true));
    }

    if (url.pathname === '/api/analyze') {
      const history = await getHistory(env.AGENT_KV);
      const traces = await Promise.all(history.slice(0, 100).map((h) => getTrace(env.AGENT_KV, h.traceId)));
      return json(analyzeTraces(traces.filter(Boolean)));
    }

    if (url.pathname === '/api/matrix') {
      if (request.method === 'GET') return json(await getMatrix(env.AGENT_KV));
      if (request.method === 'PUT') {
        const matrix = await request.json();
        await setMatrix(env.AGENT_KV, matrix);
        return json({ ok: true });
      }
    }

    return json({ error: 'not found' }, 404);
  }
};
