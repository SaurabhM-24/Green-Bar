/**
 * @fileoverview Cryptographic and Key Management Utilities for Client-Side Encryption
 */

/**
 * Encodes an ArrayBuffer into a Base64 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function bufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Decodes a Base64 string into an ArrayBuffer.
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToBuffer(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * Generates a random cryptographic salt or key of specified byte length.
 * @param {number} length 
 * @returns {Uint8Array}
 */
export function generateRandomBytes(length = 32) {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return array;
}

/**
 * Generates a new 256-bit AES-GCM Data Master Key (DMK).
 * @returns {Promise<CryptoKey>}
 */
export async function generateDMK() {
	return await crypto.subtle.generateKey(
		{
			name: 'AES-GCM',
			length: 256
		},
		true,
		['encrypt', 'decrypt']
	);
}

/**
 * Imports a raw ArrayBuffer (like from PRF or PBKDF2) as an AES-GCM CryptoKey.
 * @param {ArrayBuffer} rawKey 
 * @returns {Promise<CryptoKey>}
 */
export async function importRawKey(rawKey) {
	return await crypto.subtle.importKey(
		'raw',
		rawKey,
		{ name: 'AES-GCM' },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Derives a Key Encryption Key (KEK) from a PIN/Password using PBKDF2.
 * @param {string} pin 
 * @param {ArrayBuffer} salt 
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKEKFromPIN(pin, salt) {
	const enc = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		enc.encode(pin),
		{ name: 'PBKDF2' },
		false,
		['deriveBits', 'deriveKey']
	);

	return await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 600000,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		true,
		['encrypt', 'decrypt']
	);
}

/**
 * Encrypts data using AES-GCM.
 * @param {string|object} data Plaintext string or JSON object
 * @param {CryptoKey} key The key to encrypt with
 * @returns {Promise<string>} Format: "base64(iv):base64(ciphertext)"
 */
export async function encryptData(data, key) {
	const enc = new TextEncoder();
	const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
	
	const iv = crypto.getRandomValues(new Uint8Array(12));
	
	const ciphertextBuffer = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		enc.encode(plaintext)
	);

	const ivBase64 = bufferToBase64(iv.buffer);
	const ciphertextBase64 = bufferToBase64(ciphertextBuffer);

	return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Decrypts data using AES-GCM.
 * @param {string} encryptedString Format: "base64(iv):base64(ciphertext)"
 * @param {CryptoKey} key 
 * @returns {Promise<string>} Plaintext string
 */
export async function decryptData(encryptedString, key) {
	const [ivBase64, ciphertextBase64] = encryptedString.split(':');
	if (!ivBase64 || !ciphertextBase64) throw new Error('Invalid encrypted string format');

	const iv = base64ToBuffer(ivBase64);
	const ciphertext = base64ToBuffer(ciphertextBase64);

	const decryptedBuffer = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		ciphertext
	);

	const dec = new TextDecoder();
	return dec.decode(decryptedBuffer);
}

/**
 * Exports a CryptoKey to raw ArrayBuffer so it can be encrypted.
 * @param {CryptoKey} key 
 * @returns {Promise<ArrayBuffer>}
 */
export async function exportKey(key) {
	return await crypto.subtle.exportKey('raw', key);
}

// --- WebAuthn PRF Helpers ---

/**
 * Registers a new WebAuthn credential with the PRF extension.
 * @param {string} userName 
 * @param {Uint8Array} userId 
 * @returns {Promise<{credential: PublicKeyCredential, prfSupported: boolean, prfKey: ArrayBuffer|null, prfSalt: ArrayBuffer|null}>}
 */
export async function registerWebAuthnPRF(userName, userId) {
	const challenge = generateRandomBytes(32);
	const prfSalt = generateRandomBytes(32);

	/** @type {any} */
	const publicKey = {
		challenge: challenge,
		rp: { name: "Green Bar Expense Tracker", id: window.location.hostname },
		user: {
			id: userId,
			name: userName,
			displayName: userName
		},
		pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
		authenticatorSelection: {
			authenticatorAttachment: "platform",
			residentKey: "required",
			userVerification: "required"
		},
		extensions: {
			prf: {
				eval: {
					first: prfSalt
				}
			}
		}
	};

	try {
		const credential = /** @type {any} */ (await navigator.credentials.create({ publicKey }));
		const extensionResults = credential.getClientExtensionResults();
		
		let prfKey = null;
		let prfSupported = false;
		
		if (extensionResults.prf && extensionResults.prf.enabled) {
			// Actually PRF key material isn't generated during create unless eval is supported and executed, 
			// wait, according to spec, create() can output prf results if requested.
			if (extensionResults.prf.results && extensionResults.prf.results.first) {
				prfKey = extensionResults.prf.results.first;
				prfSupported = true;
			} else {
                // If it's enabled but no results, we will verify during assertion.
                prfSupported = true;
            }
		}

		return { credential, prfSupported, prfKey, prfSalt: /** @type {ArrayBuffer} */ (prfSalt.buffer) };
	} catch (err) {
		console.error("WebAuthn Registration Error:", err);
		throw err;
	}
}

/**
 * Authenticates a WebAuthn credential and evaluates the PRF.
 * @param {ArrayBuffer} prfSalt 
 * @returns {Promise<{prfKey: ArrayBuffer}>}
 */
export async function assertWebAuthnPRF(prfSalt) {
	const challenge = generateRandomBytes(32);

	/** @type {any} */
	const publicKey = {
		challenge: challenge,
		rpId: window.location.hostname,
		userVerification: "required",
		extensions: {
			prf: {
				eval: {
					first: prfSalt
				}
			}
		}
	};

	try {
		const credential = /** @type {any} */ (await navigator.credentials.get({ publicKey }));
		const extensionResults = credential.getClientExtensionResults();
		
		if (!extensionResults.prf || !extensionResults.prf.results || !extensionResults.prf.results.first) {
			throw new Error("WebAuthn PRF not supported or failed on this device.");
		}

		return { prfKey: extensionResults.prf.results.first };
	} catch (err) {
		console.error("WebAuthn Assertion Error:", err);
		throw err;
	}
}
