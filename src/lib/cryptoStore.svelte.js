/**
 * @fileoverview Centralized state management for holding the sensitive Data Master Key (DMK) in memory.
 * Never persist this to localStorage.
 */

class CryptoStore {
	/** @type {CryptoKey | null} The unlocked Data Master Key */
	dmk = $state(null);
    
    /** @type {boolean} True if the DMK is currently unlocked and available */
    isUnlocked = $derived(this.dmk !== null);

	/**
	 * Sets the DMK into memory.
	 * @param {CryptoKey} key 
	 */
	setDMK(key) {
		this.dmk = key;
	}

	/**
	 * Clears the DMK from memory (e.g., on logout or session timeout).
	 */
	clearDMK() {
		this.dmk = null;
	}
}

export const cryptoStore = new CryptoStore();
