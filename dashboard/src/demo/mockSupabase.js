// A tiny in-memory stand-in for the Supabase client, used only by the recruiter demo (?demo=1).
// It supports the calls the dashboard makes: from().select/insert/update/upsert/delete with eq/neq/in/not/order/limit/single,
// channel().on().subscribe() (with live INSERT events for chat), removeChannel and a few no-op auth/storage calls.
// Nothing here makes a network request. Everything resets when the page is refreshed.

export function createMockClient(seed) {
  const tables = {};
  Object.entries(seed).forEach(([name, rows]) => { tables[name] = rows.map(r => ({ ...r })); });
  const listeners = []; // { table, event, cb }
  let autoId = 1000;

  const emit = (table, eventType, row, oldRow) => {
    listeners.filter(l => l.table === table && (l.event === '*' || l.event === eventType))
      .forEach(l => l.cb({ eventType, new: row, old: oldRow || {} }));
  };

  const matches = (row, filters) => filters.every(f => {
    const v = row[f.col];
    if (f.op === 'eq') return v === f.val;
    if (f.op === 'neq') return v !== f.val;
    if (f.op === 'in') return f.val.includes(v);
    if (f.op === 'not_null') return v !== null && v !== undefined;
    return true;
  });

  class Query {
    constructor(table) {
      this.table = table; this.action = 'select'; this.filters = []; this.payload = null;
      this.orderBy = null; this.max = null; this.mode = 'many'; this.wantRows = false;
    }
    select() { if (this.action !== 'select') this.wantRows = true; return this; }
    insert(rows) { this.action = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
    upsert(rows) { this.action = 'upsert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
    update(obj) { this.action = 'update'; this.payload = obj; return this; }
    delete() { this.action = 'delete'; return this; }
    eq(col, val) { this.filters.push({ op: 'eq', col, val }); return this; }
    neq(col, val) { this.filters.push({ op: 'neq', col, val }); return this; }
    in(col, val) { this.filters.push({ op: 'in', col, val }); return this; }
    not(col, op, val) { if (op === 'is' && val === null) this.filters.push({ op: 'not_null', col }); return this; }
    order(col, opts = {}) { this.orderBy = { col, asc: opts.ascending !== false }; return this; }
    limit(n) { this.max = n; return this; }
    single() { this.mode = 'single'; return this; }
    maybeSingle() { this.mode = 'maybe'; return this; }

    run() {
      const rows = (tables[this.table] = tables[this.table] || []);
      let out = [];
      if (this.action === 'insert') {
        out = this.payload.map(r => {
          const row = { id: r.id ?? ++autoId, created_at: new Date().toISOString(), ...r };
          rows.push(row);
          emit(this.table, 'INSERT', row);
          return row;
        });
      } else if (this.action === 'upsert') {
        out = this.payload.map(r => {
          const i = rows.findIndex(x => x.id === r.id);
          if (i >= 0) { const old = rows[i]; rows[i] = { ...old, ...r }; emit(this.table, 'UPDATE', rows[i], old); return rows[i]; }
          const row = { id: r.id ?? ++autoId, created_at: new Date().toISOString(), ...r };
          rows.push(row); emit(this.table, 'INSERT', row); return row;
        });
      } else if (this.action === 'update') {
        rows.forEach((row, i) => {
          if (matches(row, this.filters)) { const old = row; rows[i] = { ...row, ...this.payload }; emit(this.table, 'UPDATE', rows[i], old); out.push(rows[i]); }
        });
      } else if (this.action === 'delete') {
        for (let i = rows.length - 1; i >= 0; i--) {
          if (matches(rows[i], this.filters)) { const [gone] = rows.splice(i, 1); emit(this.table, 'DELETE', {}, gone); out.push(gone); }
        }
      } else {
        out = rows.filter(r => matches(r, this.filters));
        if (this.orderBy) {
          const { col, asc } = this.orderBy;
          out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
        }
        if (this.max != null) out = out.slice(0, this.max);
      }
      const writes = this.action !== 'select';
      if (this.mode === 'single') {
        return out[0] ? { data: out[0], error: null } : { data: null, error: { message: 'No rows' } };
      }
      if (this.mode === 'maybe') return { data: out[0] || null, error: null };
      return { data: writes && !this.wantRows ? null : out.map(r => ({ ...r })), error: null };
    }
    then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }
  }

  // The chat table: the real app talks to a local AI daemon. In the demo, reply with a clear notice.
  const originalInsert = Query.prototype.insert;
  Query.prototype.insert = function (rows) {
    const q = originalInsert.call(this, rows);
    if (this.table === 'agent_chat') {
      const first = (Array.isArray(rows) ? rows : [rows])[0] || {};
      if (first.sender === 'user') {
        setTimeout(() => {
          const text = '🔒 Demo mode: the AI commander is switched off here. In the real app this chat talks to my own local agent that finds jobs, tailors CVs and checks my inbox.';
          const row = { id: ++autoId, sender: 'agent', role: 'assistant', content: text, message: text, created_at: new Date().toISOString() };
          tables.agent_chat.push(row);
          emit('agent_chat', 'INSERT', row);
        }, 700);
      }
    }
    return q;
  };

  return {
    from: table => new Query(table),
    channel() {
      const ch = {
        on(_type, filter, cb) {
          listeners.push({ table: filter && filter.table, event: (filter && filter.event) || '*', cb });
          return ch;
        },
        subscribe() { return ch; },
      };
      return ch;
    },
    removeChannel() {},
    removeAllChannels() {},
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
    },
    storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: { message: 'Downloads are disabled in the demo' } }) }) },
    rpc: async () => ({ data: null, error: { message: 'Not available in the demo' } }),
  };
}
