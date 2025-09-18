<script lang="ts">
	interface Props {
		isOpen: boolean;
		onclose: () => void;
	}

	let { isOpen = $bindable(), onclose }: Props = $props();

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onclose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose();
		}
	}
</script>

{#if isOpen}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="howtoplay-modal-title"
		tabindex="-1"
	>
		<div class="modal-content">
			<h2 id="howtoplay-modal-title" class="modal-title">遊び方</h2>

			<div class="modal-body">
				<section class="section">
					<h3 class="section-title">🎮 ゲームの概要</h3>
					<p class="section-content">
						上毛カルタの読み札を見ながら、取り札の文字をタイピングするゲームです。
						正確で素早いタイピングを目指しましょう！
					</p>
				</section>

				<section class="section">
					<h3 class="section-title">📚 練習モード</h3>
					<div class="mode-list">
						<div class="mode-item">
							<span class="mode-name">全44札を順番に練習</span>
							<span class="mode-desc">あ〜わ行の順番で全ての札を練習できます</span>
						</div>
						<div class="mode-item">
							<span class="mode-name">特定札で練習</span>
							<span class="mode-desc">好きな札を選んで集中的に練習できます</span>
						</div>
					</div>
				</section>

				<section class="section">
					<h3 class="section-title">🎯 プレイ開始（ランダムモード）</h3>
					<p class="section-content">
						全44札がランダムな順序で出題されます。 タイムを競い、ランキングに挑戦しましょう！
					</p>
				</section>

				<section class="section">
					<h3 class="section-title">⌨️ タイピングルール</h3>
					<ul class="rule-list">
						<li>ひらがなで入力してください</li>
						<li>句読点や「ゃ」「ゅ」「ょ」などの小文字も正確に入力</li>
						<li>間違えた文字は赤く表示されます</li>
						<li>Escキーでゲームを一時停止できます</li>
					</ul>
				</section>

				<section class="section">
					<h3 class="section-title">🏆 ランキング</h3>
					<p class="section-content">
						ランダムモードの記録はランキングに登録できます。 全国のプレイヤーと競い合いましょう！
					</p>
				</section>

				<div class="image-container">
					<img src="/images/how-to-play.png" alt="ゲーム画面の説明" class="how-to-play-image" />
				</div>
			</div>

			<div class="modal-footer">
				<button onclick={onclose} class="close-button" type="button">閉じる</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		max-width: 1000px;
		width: 90%;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		animation: slideUp 0.3s ease-out;
	}

	.modal-title {
		font-size: 1.75rem;
		font-weight: bold;
		color: #166534; /* green-800 */
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.modal-body {
		margin-bottom: 1.5rem;
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #059669; /* green-600 */
		margin-bottom: 0.75rem;
	}

	.section-content {
		color: #4b5563; /* gray-600 */
		line-height: 1.6;
	}

	.mode-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.mode-item {
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		background: #f0fdf4; /* green-50 */
		border-radius: 6px;
		border-left: 3px solid #22c55e; /* green-500 */
	}

	.mode-name {
		font-weight: 600;
		color: #166534; /* green-800 */
		margin-bottom: 0.25rem;
	}

	.mode-desc {
		font-size: 0.875rem;
		color: #6b7280; /* gray-500 */
	}

	.rule-list {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0 0;
	}

	.rule-list li {
		position: relative;
		padding-left: 1.5rem;
		margin-bottom: 0.5rem;
		color: #4b5563; /* gray-600 */
		line-height: 1.6;
	}

	.rule-list li::before {
		content: '•';
		position: absolute;
		left: 0.5rem;
		color: #22c55e; /* green-500 */
		font-weight: bold;
	}

	.modal-footer {
		display: flex;
		justify-content: center;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb; /* gray-200 */
	}

	.close-button {
		padding: 0.625rem 2rem;
		border: none;
		border-radius: 6px;
		background: #22c55e; /* green-500 */
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: #16a34a; /* green-600 */
		transform: translateY(-1px);
	}

	.image-container {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb; /* gray-200 */
	}

	.how-to-play-image {
		width: 100%;
		height: auto;
		border-radius: 8px;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* モバイル対応 */
	@media (max-width: 640px) {
		.modal-content {
			padding: 1.5rem;
			width: 95%;
			max-height: 90vh;
		}

		.modal-title {
			font-size: 1.5rem;
		}

		.section-title {
			font-size: 1rem;
		}

		.section-content,
		.rule-list li {
			font-size: 0.875rem;
		}

		.mode-desc {
			font-size: 0.75rem;
		}
	}
</style>
