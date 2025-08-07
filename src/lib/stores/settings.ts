import { writable, get } from 'svelte/store';
import type {
	UserSettings,
	DisplaySettings,
	SoundSettings,
	PracticeSettings,
	KeyboardSettings,
	AccessibilitySettings
} from '$lib/types/game';

// Default settings
const defaultSettings: UserSettings = {
	// GameSettings
	mode: 'practice',
	inputMode: 'partial',
	partialLength: 5,
	soundEnabled: true,
	bgmEnabled: true,
	showHints: true,
	showRomaji: true,
	fontSize: 'medium',
	theme: 'auto',

	// Extended settings
	display: {
		fontSize: 'medium',
		theme: 'auto',
		animations: true,
		animationSpeed: 'normal',
		showFurigana: true,
		showMeaning: true
	},
	sound: {
		effectsEnabled: true,
		effectsVolume: 50,
		bgmEnabled: true,
		bgmVolume: 50,
		typingSoundEnabled: true,
		typingSoundVolume: 50,
		voiceEnabled: false,
		voiceSpeed: 1.0
	},
	practice: {
		order: 'sequential',
		repetitions: 1,
		timeLimit: null,
		difficulty: 'custom'
	},
	keyboard: {
		layout: 'JIS',
		inputMethod: 'romaji',
		shortcuts: {
			pause: 'Escape',
			skip: 'Tab',
			retry: 'Control+R'
		}
	},
	accessibility: {
		highContrast: false,
		reduceMotion: false,
		screenReaderMode: false,
		keyboardOnly: false
	}
};

// Difficulty presets
const difficultyPresets = {
	beginner: {
		showHints: true,
		showRomaji: true,
		partialLength: 5,
		practice: {
			timeLimit: null,
			repetitions: 2
		}
	},
	intermediate: {
		showHints: false,
		showRomaji: true,
		partialLength: 7,
		practice: {
			timeLimit: 60,
			repetitions: 1
		}
	},
	advanced: {
		showHints: false,
		showRomaji: false,
		partialLength: 10,
		practice: {
			timeLimit: 30,
			repetitions: 1
		}
	}
};

function createSettingsStore() {
	const { subscribe, set, update } = writable<UserSettings>(defaultSettings);

	let savedSettings: UserSettings = { ...defaultSettings };
	let changedPaths = new Set<string>();

	// Helper function to get nested property
	function getNestedProperty(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}

	// Helper function to set nested property
	function setNestedProperty(obj: any, path: string, value: any): void {
		const keys = path.split('.');
		const lastKey = keys.pop()!;
		const target = keys.reduce((current, key) => {
			if (!current[key]) current[key] = {};
			return current[key];
		}, obj);
		target[lastKey] = value;
	}

	// Validation functions
	function validateRange(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	function validateValue(path: string, value: any): any {
		// Numeric range validations
		const rangeValidations: Record<string, { min: number; max: number }> = {
			partialLength: { min: 3, max: 10 },
			'sound.effectsVolume': { min: 0, max: 100 },
			'sound.bgmVolume': { min: 0, max: 100 },
			'sound.typingSoundVolume': { min: 0, max: 100 },
			'sound.voiceSpeed': { min: 0.5, max: 2.0 },
			'practice.repetitions': { min: 1, max: 5 }
		};

		if (rangeValidations[path]) {
			const { min, max } = rangeValidations[path];
			return validateRange(value, min, max);
		}

		// Enum validations
		const enumValidations: Record<string, string[]> = {
			'display.fontSize': ['small', 'medium', 'large', 'extra-large'],
			'display.theme': ['light', 'dark', 'auto'],
			'display.animationSpeed': ['slow', 'normal', 'fast'],
			'practice.order': ['sequential', 'random', 'weak-first'],
			'practice.difficulty': ['beginner', 'intermediate', 'advanced', 'custom'],
			'keyboard.layout': ['JIS', 'US'],
			'keyboard.inputMethod': ['romaji', 'kana']
		};

		if (enumValidations[path] && !enumValidations[path].includes(value)) {
			// Return current value if invalid
			return getNestedProperty(get({ subscribe }), path);
		}

		return value;
	}

	return {
		subscribe,

		// Get default settings
		getDefaults: () => defaultSettings,

		// Update a specific setting
		updateSetting: (path: string, value: any) => {
			const validatedValue = validateValue(path, value);

			update((settings) => {
				const newSettings = { ...settings };
				setNestedProperty(newSettings, path, validatedValue);
				changedPaths.add(path);
				return newSettings;
			});
		},

		// Apply difficulty preset
		applyPreset: (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
			const preset = difficultyPresets[difficulty];

			update((settings) => ({
				...settings,
				showHints: preset.showHints,
				showRomaji: preset.showRomaji,
				partialLength: preset.partialLength,
				practice: {
					...settings.practice,
					...preset.practice,
					difficulty
				}
			}));

			// Mark relevant paths as changed
			changedPaths.add('showHints');
			changedPaths.add('showRomaji');
			changedPaths.add('partialLength');
			changedPaths.add('practice.timeLimit');
			changedPaths.add('practice.repetitions');
			changedPaths.add('practice.difficulty');
		},

		// Save settings to localStorage
		save: async () => {
			const settings = get({ subscribe });
			try {
				localStorage.setItem('userSettings', JSON.stringify(settings));
				savedSettings = { ...settings };
				changedPaths.clear();
			} catch (error) {
				console.error('Failed to save settings:', error);
				throw error;
			}
		},

		// Load settings from localStorage
		load: async () => {
			try {
				const stored = localStorage.getItem('userSettings');
				if (stored) {
					const parsed = JSON.parse(stored);
					// Merge with defaults to ensure all properties exist
					const merged = {
						...defaultSettings,
						...parsed,
						display: { ...defaultSettings.display, ...parsed.display },
						sound: { ...defaultSettings.sound, ...parsed.sound },
						practice: { ...defaultSettings.practice, ...parsed.practice },
						keyboard: {
							...defaultSettings.keyboard,
							...parsed.keyboard,
							shortcuts: {
								...defaultSettings.keyboard.shortcuts,
								...parsed.keyboard?.shortcuts
							}
						},
						accessibility: { ...defaultSettings.accessibility, ...parsed.accessibility }
					};
					set(merged);
					savedSettings = { ...merged };
				}
			} catch (error) {
				console.error('Failed to load settings:', error);
				// Keep default settings on error
			}
		},

		// Reset all settings to default
		reset: () => {
			set(defaultSettings);
			savedSettings = { ...defaultSettings };
			changedPaths.clear();
		},

		// Reset specific section
		resetSection: (
			section: keyof UserSettings | 'display' | 'sound' | 'practice' | 'keyboard' | 'accessibility'
		) => {
			update((settings) => {
				const newSettings = { ...settings };

				if (section in defaultSettings) {
					// For top-level properties
					(newSettings as any)[section] = (defaultSettings as any)[section];
				} else {
					// For nested sections
					switch (section) {
						case 'display':
							newSettings.display = { ...defaultSettings.display };
							break;
						case 'sound':
							newSettings.sound = { ...defaultSettings.sound };
							break;
						case 'practice':
							newSettings.practice = { ...defaultSettings.practice };
							break;
						case 'keyboard':
							newSettings.keyboard = { ...defaultSettings.keyboard };
							break;
						case 'accessibility':
							newSettings.accessibility = { ...defaultSettings.accessibility };
							break;
					}
				}

				// Remove changed paths for this section
				changedPaths = new Set(
					Array.from(changedPaths).filter((path) => !path.startsWith(section))
				);

				return newSettings;
			});
		},

		// Export settings as JSON
		export: () => {
			const settings = get({ subscribe });
			return JSON.stringify(
				{
					version: '1.0.0',
					exportDate: new Date().toISOString(),
					settings
				},
				null,
				2
			);
		},

		// Import settings from JSON
		import: async (jsonString: string) => {
			try {
				const parsed = JSON.parse(jsonString);

				if (!parsed.settings) {
					throw new Error('Invalid settings format');
				}

				// Merge with defaults and validate
				const merged = {
					...defaultSettings,
					...parsed.settings,
					display: { ...defaultSettings.display, ...parsed.settings.display },
					sound: { ...defaultSettings.sound, ...parsed.settings.sound },
					practice: { ...defaultSettings.practice, ...parsed.settings.practice },
					keyboard: {
						...defaultSettings.keyboard,
						...parsed.settings.keyboard,
						shortcuts: {
							...defaultSettings.keyboard.shortcuts,
							...parsed.settings.keyboard?.shortcuts
						}
					},
					accessibility: { ...defaultSettings.accessibility, ...parsed.settings.accessibility }
				};

				set(merged);
				savedSettings = { ...merged };
				changedPaths.clear();
			} catch (error) {
				console.error('Failed to import settings:', error);
				throw error;
			}
		},

		// Check if there are unsaved changes
		hasChanges: () => changedPaths.size > 0,

		// Get list of changed settings
		getChangedSettings: () => Array.from(changedPaths)
	};
}

export const settingsStore = createSettingsStore();
