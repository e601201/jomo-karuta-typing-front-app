import { settingsStore } from '$lib/stores/settings';
import { get } from 'svelte/store';

export class TypingSoundManager {
	private correctSound: HTMLAudioElement | null = null;
	private incorrectSound: HTMLAudioElement | null = null;
	private gameEndSound: HTMLAudioElement | null = null;
	private typingSoundEnabled: boolean = true;
	private effectsEnabled: boolean = true;
	private typingSoundVolume: number = 0.5;
	private effectsVolume: number = 0.5;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			this.initializeSounds();
			this.loadSettingsFromStore();
			this.subscribeToSettings();
		}
	}

	private initializeSounds() {
		try {
			this.correctSound = new Audio('/sounds/typing/keyStroke.mp3');
			this.incorrectSound = new Audio('/sounds/typing/incorrect.mp3');
			this.gameEndSound = new Audio('/sounds/effects/whistle.mp3');

			this.correctSound.volume = this.typingSoundVolume;
			this.incorrectSound.volume = this.typingSoundVolume;
			this.gameEndSound.volume = this.effectsVolume;

			this.correctSound.preload = 'auto';
			this.incorrectSound.preload = 'auto';
			this.gameEndSound.preload = 'auto';
		} catch (error) {
			console.error('Failed to initialize typing sounds:', error);
		}
	}

	public playCorrect() {
		if (!this.typingSoundEnabled || !this.correctSound) return;
		try {
			const sound = this.correctSound.cloneNode() as HTMLAudioElement;
			sound.volume = this.typingSoundVolume;
			sound.play().catch((error) => {
				console.error('Failed to play correct sound:', error);
			});
		} catch (error) {
			console.error('Error playing correct sound:', error);
		}
	}

	public playIncorrect() {
		if (!this.typingSoundEnabled || !this.incorrectSound) return;
		try {
			const sound = this.incorrectSound.cloneNode() as HTMLAudioElement;
			sound.volume = this.typingSoundVolume;
			sound.play().catch((error) => {
				console.error('Failed to play incorrect sound:', error);
			});
		} catch (error) {
			console.error('Error playing incorrect sound:', error);
		}
	}

	public playGameEnd() {
		if (!this.effectsEnabled || !this.gameEndSound) return;

		try {
			const sound = this.gameEndSound.cloneNode() as HTMLAudioElement;
			sound.volume = this.effectsVolume;
			sound.play().catch((error) => {
				console.error('Failed to play game end sound:', error);
			});
		} catch (error) {
			console.error('Error playing game end sound:', error);
		}
	}

	public setEnabled(typingSoundEnabled: boolean, effectsEnabled: boolean) {
		this.typingSoundEnabled = typingSoundEnabled;
		this.effectsEnabled = effectsEnabled;
	}

	public setVolume(typingSoundVolume: number, effectsVolume: number) {
		this.typingSoundVolume = Math.max(0, Math.min(1, typingSoundVolume));
		this.effectsVolume = Math.max(0, Math.min(1, effectsVolume));
		if (this.correctSound) {
			this.correctSound.volume = this.typingSoundVolume;
		}
		if (this.incorrectSound) {
			this.incorrectSound.volume = this.typingSoundVolume;
		}
		if (this.gameEndSound) {
			this.gameEndSound.volume = this.effectsVolume;
		}
	}

	public isAvailable(): boolean {
		return this.correctSound !== null && this.incorrectSound !== null;
	}

	private loadSettingsFromStore() {
		const settings = get(settingsStore);
		// 音量を0-100から0-1に変換
		this.typingSoundEnabled = settings.sound.typingSoundEnabled;
		this.typingSoundVolume = settings.sound.typingSoundVolume / 100;
		this.effectsEnabled = settings.sound.effectsEnabled;
		this.effectsVolume = settings.sound.effectsVolume / 100;

		// 既存の音声要素に適用
		if (this.correctSound) {
			this.correctSound.volume = this.typingSoundVolume;
		}
		if (this.incorrectSound) {
			this.incorrectSound.volume = this.typingSoundVolume;
		}
		if (this.gameEndSound) {
			this.gameEndSound.volume = this.effectsVolume;
		}
	}

	private subscribeToSettings() {
		this.unsubscribe = settingsStore.subscribe((settings) => {
			// 音量設定の変更を監視
			const newTypingSoundEnabled = settings.sound.typingSoundEnabled;
			const newTypingSoundVolume = settings.sound.typingSoundVolume / 100;
			const newEffectsEnabled = settings.sound.effectsEnabled;
			const newEffectsVolume = settings.sound.effectsVolume / 100;

			if (this.typingSoundEnabled !== newTypingSoundEnabled) {
				this.typingSoundEnabled = newTypingSoundEnabled;
			}

			if (this.typingSoundVolume !== newTypingSoundVolume) {
				this.typingSoundVolume = newTypingSoundVolume;
				this.setVolume(newTypingSoundVolume, this.effectsVolume);
			}

			if (this.effectsEnabled !== newEffectsEnabled) {
				this.effectsEnabled = newEffectsEnabled;
			}

			if (this.effectsVolume !== newEffectsVolume) {
				this.effectsVolume = newEffectsVolume;
				this.setVolume(this.typingSoundVolume, newEffectsVolume);
			}
		});
	}

	public destroy() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}
}
