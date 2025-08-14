import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
	return {
		origin: url.origin,
		path: url.pathname
	};
};


