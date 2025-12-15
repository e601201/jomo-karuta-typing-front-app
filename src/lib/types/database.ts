export interface Profile {
	id: string;
	nickname: string;
	avatar_url?: string | null;
	bio?: string | null;
	email_public: boolean;
	created_at: string;
	updated_at: string;
}
