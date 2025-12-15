import { writable } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		session: null,
		loading: true
	});

	return {
		subscribe,
		setSession: (session: Session | null) => {
			update((state) => ({
				...state,
				session,
				user: session?.user ?? null,
				loading: false
			}));
		},
		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, loading }));
		},
		reset: () => {
			set({
				user: null,
				session: null,
				loading: false
			});
		}
	};
}

export const authStore = createAuthStore();
