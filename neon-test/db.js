import { createClient } from 'https://esm.sh/@neon/neon-js@0.10.2';
import { AUTH_URL, DATA_URL } from './config.js';

const client = createClient({ auth: { url: AUTH_URL, allowAnonymous: true }, dataApi: { url: DATA_URL } });

// Interface no mesmo formato que o site já usava.
export const sb = {
  rpc: (fn, args) => client.rpc(fn, args || {}),
  from: (t) => client.from(t),
  auth: {
    async getSession() {
      try {
        const { data } = await client.auth.getSession();
        return { data: { session: data && data.session && data.user ? data.session : null, user: data?.user || null } };
      } catch (e) { return { data: { session: null } }; }
    },
    signOut: () => client.auth.signOut(),
    async signInWithOtp({ email, options }) {
      const { error } = await client.auth.signIn.magicLink({ email, callbackURL: options?.emailRedirectTo });
      return { error };
    }
  }
};
