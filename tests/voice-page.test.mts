import assert from 'node:assert/strict';
import test from 'node:test';

const events = new EventTarget();
(globalThis as any).window = Object.assign(events, { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, matchMedia: () => ({ matches: false }) });
(globalThis as any).history = { state: null, pushState() {}, back() {} };
const { agentForVoice, chatForVoice, latestChatIn } = await import('../core/web/src/voice-page.ts');

const agent = (id: string, extra = {}) => ({ id, name: id.toUpperCase(), home: `/h/${id}`, first: false, newChats: false, ...extra });
const chat = (id: string, workspace: string, updated_at: string, extra = {}) => ({ id, workspace, updated_at, title: id, ...extra }) as any;
const agents = [agent('main', { first: true }), agent('voicy', { newChats: true }), agent('other')];

function deps(created: string[] = []) {
  return {
    agents: async () => ({ agents }),
    createSession: async (workspace?: string) => { created.push(workspace ?? ''); return chat('new', workspace ?? '', '2026-01-01') },
  };
}

test('without ?agent the agent New starts chats with is taken, else the first', () => {
  assert.equal(agentForVoice(agents, null)?.id, 'voicy');
  assert.equal(agentForVoice(agents.map((a) => ({ ...a, newChats: false })), null)?.id, 'main');
});

test('?agent picks that agent, and one nobody has falls back to the default', () => {
  assert.equal(agentForVoice(agents, 'other')?.id, 'other');
  assert.equal(agentForVoice(agents, 'gone')?.id, 'voicy');
});

test('the latest chat of the agent is opened, not a sub-chat or a routine run, nor another agent\'s', async () => {
  const sessions = [
    chat('old', '/h/voicy', '2026-01-01'),
    chat('latest', '/h/voicy', '2026-03-01'),
    chat('sub', '/h/voicy', '2026-04-01', { parent: 'latest' }),
    chat('run', '/h/voicy', '2026-05-01', { kind: 'routine' }),
    chat('theirs', '/h/other', '2026-06-01'),
  ];
  assert.equal(latestChatIn(sessions, '/h/voicy')?.id, 'latest');
  const created: string[] = [];
  const got = await chatForVoice(deps(created), sessions, null);
  assert.equal(got?.session.id, 'latest');
  assert.deepEqual(created, []);
  assert.equal((await chatForVoice(deps(created), sessions, 'other'))?.session.id, 'theirs');
});

test('an agent with no chat gets a new one in its home', async () => {
  const created: string[] = [];
  const got = await chatForVoice(deps(created), [chat('x', '/h/main', '2026-01-01')], 'voicy');
  assert.equal(got?.session.id, 'new');
  assert.deepEqual(created, ['/h/voicy']);
});

test('no agents at all is no chat, and nothing is created', async () => {
  const created: string[] = [];
  assert.equal(await chatForVoice({ agents: async () => ({ agents: [] }), createSession: deps(created).createSession }, [], null), null);
  assert.deepEqual(created, []);
});

test('only a touch of the orb starts a conversation: the idle stage calls onStart from the click and nowhere else', async () => {
  const { readFileSync } = await import('node:fs');
  const idle = readFileSync(new URL('../core/web/src/components/VoicePageIdle.tsx', import.meta.url), 'utf8');
  assert.equal(idle.match(/onStart/g)?.length, 3); // the prop, its type, the click
  assert.match(idle, /onClick=\{onStart\}/);
  assert.doesNotMatch(idle, /useEffect|useLayoutEffect/);
  const control = readFileSync(new URL('../core/web/src/components/VoiceControl.tsx', import.meta.url), 'utf8');
  assert.match(control, /<VoicePageIdle [^>]*onStart=\{\(\) => \{ void start\(\); \}\}/);
});
