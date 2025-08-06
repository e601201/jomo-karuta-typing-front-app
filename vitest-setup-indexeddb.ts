// Setup fake-indexeddb for testing
import 'fake-indexeddb/auto';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';

// Setup globals
if (typeof globalThis.indexedDB === 'undefined') {
	globalThis.indexedDB = new FDBFactory();
}