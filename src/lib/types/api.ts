/**
 * API関連の型定義
 */

/**
 * 汎用APIレスポンス
 */
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: ApiError;
	metadata?: ResponseMetadata;
}

/**
 * APIエラー
 */
export interface ApiError {
	code: string;
	message: string;
	details?: unknown;
}

/**
 * レスポンスメタデータ
 */
export interface ResponseMetadata {
	timestamp: string;
	version: string;
	requestId?: string;
}