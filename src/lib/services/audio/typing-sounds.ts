export class TypingSoundManager {
	private correctSound: HTMLAudioElement | null = null;
	private incorrectSound: HTMLAudioElement | null = null;
	private gameEndSound: HTMLAudioElement | null = null;
	private isEnabled: boolean = true;
	private volume: number = 0.5;

	constructor() {
		if (typeof window !== 'undefined') {
			this.initializeSounds();
		}
	}

	private initializeSounds() {
		try {
			this.correctSound = new Audio('/sounds/typing/keyStroke.mp3');
			this.incorrectSound = new Audio('/sounds/typing/incorrect.mp3');
			this.gameEndSound = new Audio('/sounds/effects/whistle.mp3');

			this.correctSound.volume = this.volume;
			this.incorrectSound.volume = this.volume;
			this.gameEndSound.volume = this.volume;

			this.correctSound.preload = 'auto';
			this.incorrectSound.preload = 'auto';
			this.gameEndSound.preload = 'auto';
		} catch (error) {
			console.error('Failed to initialize typing sounds:', error);
		}
	}

	public playCorrect() {
		if (!this.isEnabled || !this.correctSound) return;

		try {
			const sound = this.correctSound.cloneNode() as HTMLAudioElement;
			sound.volume = this.volume;
			sound.play().catch((error) => {
				console.error('Failed to play correct sound:', error);
			});
		} catch (error) {
			console.error('Error playing correct sound:', error);
		}
	}

	public playIncorrect() {
		if (!this.isEnabled || !this.incorrectSound) return;

		try {
			const sound = this.incorrectSound.cloneNode() as HTMLAudioElement;
			sound.volume = this.volume;
			sound.play().catch((error) => {
				console.error('Failed to play incorrect sound:', error);
			});
		} catch (error) {
			console.error('Error playing incorrect sound:', error);
		}
	}

	public playGameEnd() {
		if (!this.isEnabled || !this.gameEndSound) return;

		try {
			const sound = this.gameEndSound.cloneNode() as HTMLAudioElement;
			sound.volume = this.volume;
			sound.play().catch((error) => {
				console.error('Failed to play game end sound:', error);
			});
		} catch (error) {
			console.error('Error playing game end sound:', error);
		}
	}

	public setEnabled(enabled: boolean) {
		this.isEnabled = enabled;
	}

	public setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(1, volume));
		if (this.correctSound) {
			this.correctSound.volume = this.volume;
		}
		if (this.incorrectSound) {
			this.incorrectSound.volume = this.volume;
		}
		if (this.gameEndSound) {
			this.gameEndSound.volume = this.volume;
		}
	}

	public isAvailable(): boolean {
		return this.correctSound !== null && this.incorrectSound !== null;
	}
}
