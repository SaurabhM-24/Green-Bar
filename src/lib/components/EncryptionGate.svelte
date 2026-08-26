<script>
	/**
	 * @fileoverview Encryption Gate component.
	 * Overlays the entire app if the user is authenticated but the DMK is not unlocked.
	 * Handles both initial setup (Secondary PIN + WebAuthn) and subsequent unlocks.
	 */
	import { supabase } from '$lib/supabase';
	import { Shield, KeyRound, Lock, AlertTriangle } from 'lucide-svelte';
	import { 
		generateDMK, 
		generateRandomBytes, 
		deriveKEKFromPIN, 
		encryptData, 
		decryptData, 
		registerWebAuthnPRF, 
		assertWebAuthnPRF,
		exportKey,
		importRawKey,
		bufferToBase64,
		base64ToBuffer
	} from '$lib/crypto';
	import { cryptoStore } from '$lib/cryptoStore.svelte';
	import { onMount } from 'svelte';

	let { session } = $props();

	let loading = $state(true);
	let showSetupMode = $state(false);
	let showUnlockMode = $state(false);
	/** @type {any[]} */
	let userKeys = $state([]);
	
	let setupPin = $state('');
	let confirmPin = $state('');
	let unlockPin = $state('');
	let fallbackMode = $state(false);
	
	let errorMsg = $state('');
	let successMsg = $state('');
	let isProcessing = $state(false);

	onMount(async () => {
		if (!session) return;
		
		const { data: keys, error: keysError } = await supabase
			.from('user_keys')
			.select('*')
			.eq('user_id', session.user.id);

		if (keysError) {
			errorMsg = "Error fetching encryption keys: " + keysError.message;
			loading = false;
			return;
		}

		if (keys && keys.length === 0) {
			showSetupMode = true;
		} else if (keys && keys.length > 0) {
			userKeys = keys;
			showUnlockMode = true;
			attemptWebAuthnUnlock();
		}
		loading = false;
	});

	async function attemptWebAuthnUnlock() {
		errorMsg = '';
		const passkeyRecords = userKeys.filter(k => k.key_type === 'passkey');
		
		if (passkeyRecords.length === 0) {
			fallbackMode = true;
			return;
		}

		try {
			// All passkeys should share the same salt, so we use the salt from the oldest passkey 
			// (or the first one in the list) to evaluate the PRF.
			const saltBuffer = base64ToBuffer(passkeyRecords[0].salt);
			const { prfKey } = await assertWebAuthnPRF(saltBuffer);
			const passkeyKek = await importRawKey(prfKey);
			
			let success = false;
			for (const record of passkeyRecords.reverse()) {
				try {
					const decryptedBase64Dmk = await decryptData(record.encrypted_dmk, passkeyKek);
					const rawDmk = base64ToBuffer(decryptedBase64Dmk);
					const dmk = await importRawKey(rawDmk);
					
					await migrateLegacyData(dmk);
					cryptoStore.setDMK(dmk);
					success = true;
					break;
				} catch (decryptErr) {
					// Ignore and try the next passkey record
				}
			}

			if (!success) {
				throw new Error('Failed to decrypt DMK with any passkey record.');
			}
		} catch (err) {
			console.warn("WebAuthn assertion failed, switching to fallback mode:", err);
			fallbackMode = true;
		}
	}

	/** @param {Event} e */
	async function handlePinUnlock(e) {
		e.preventDefault();
		isProcessing = true;
		errorMsg = '';

		const pinRecords = userKeys.filter(k => k.key_type === 'pin');
		if (pinRecords.length === 0) {
			errorMsg = "No PIN record found for this account.";
			isProcessing = false;
			return;
		}

		let success = false;
		let successfulPinId = null;
		
		for (const pinRecord of pinRecords.reverse()) {
			try {
				const saltBuffer = base64ToBuffer(pinRecord.salt);
				const pinKek = await deriveKEKFromPIN(unlockPin, saltBuffer);
				
				const decryptedBase64Dmk = await decryptData(pinRecord.encrypted_dmk, pinKek);
				
				const rawDmk = base64ToBuffer(decryptedBase64Dmk);
				const dmk = await importRawKey(rawDmk);
				
				await migrateLegacyData(dmk);
				cryptoStore.setDMK(dmk);
				success = true;
				successfulPinId = pinRecord.id;
				break;
			} catch (err) {
				// Ignore and try the next PIN record
			}
		}

		if (success && pinRecords.length > 1 && successfulPinId) {
			// Cleanup: if RLS allows it, remove the old PINs so only the working one remains
			supabase
				.from('user_keys')
				.delete()
				.eq('user_id', session.user.id)
				.eq('key_type', 'pin')
				.neq('id', successfulPinId)
				.then(({ error }) => {
					if (error) console.error('Failed to cleanup old PINs:', error);
				});
		}

		if (!success) {
			errorMsg = "Invalid PIN or failed to decrypt.";
		}
		isProcessing = false;
	}

	/** @param {Event} e */
	async function handleEncryptionSetup(e) {
		e.preventDefault();
		if (setupPin !== confirmPin) {
			errorMsg = "PINs do not match!";
			return;
		}
		if (setupPin.length < 6) {
			errorMsg = "PIN must be at least 6 characters.";
			return;
		}

		isProcessing = true;
		errorMsg = '';

		try {
			const dmk = await generateDMK();
			const rawDmk = await exportKey(dmk);
			const base64Dmk = bufferToBase64(rawDmk);

			const newKeys = [];

			const pinSalt = generateRandomBytes(16);
			const pinKek = await deriveKEKFromPIN(setupPin, /** @type {ArrayBuffer} */ (pinSalt.buffer));
			const encryptedDmkPin = await encryptData(base64Dmk, pinKek);

			newKeys.push({
				user_id: session.user.id,
				key_type: 'pin',
				salt: bufferToBase64(/** @type {ArrayBuffer} */ (pinSalt.buffer)),
				encrypted_dmk: encryptedDmkPin
			});

			let webAuthnSucceeded = false;
			try {
				const userName = session.user.user_metadata?.first_name || session.user.email || 'User';
				const userId = new TextEncoder().encode(session.user.id);
				const { prfSupported, prfKey, prfSalt } = await registerWebAuthnPRF(userName, userId);

				if (prfSupported && prfKey) {
					const passkeyKek = await importRawKey(prfKey);
					const encryptedDmkPasskey = await encryptData(base64Dmk, passkeyKek);

					newKeys.push({
						user_id: session.user.id,
						key_type: 'passkey',
						salt: bufferToBase64(/** @type {ArrayBuffer} */ (prfSalt)),
						encrypted_dmk: encryptedDmkPasskey
					});
					webAuthnSucceeded = true;
				} else if (prfSupported && !prfKey) {
					errorMsg = "WebAuthn supported, but PRF extension failed to initialize.";
				}
			} catch (err) {
				console.warn("WebAuthn setup skipped or failed:", err);
				if (err instanceof Error) {
					errorMsg = "WebAuthn failed: " + err.message + ". (But your PIN was saved successfully)";
				}
			}

			const { error: insertError } = await supabase.from('user_keys').insert(newKeys);
			if (insertError) throw insertError;

			if (webAuthnSucceeded) {
				await setupDefaultEncryptedBudget(dmk);
				await migrateLegacyData(dmk);
				cryptoStore.setDMK(dmk);
			} else {
				successMsg = "Encryption set up successfully with PIN. (WebAuthn was skipped)";
				await setupDefaultEncryptedBudget(dmk);
				await migrateLegacyData(dmk);
				setTimeout(() => { cryptoStore.setDMK(dmk); }, 4000);
			}

		} catch (err) {
			console.error(err);
			if (err instanceof Error) {
				errorMsg = err.message || "Failed to setup encryption.";
			}
		}
		isProcessing = false;
	}

	/**
	 * @param {CryptoKey} dmk
	 */
	async function setupDefaultEncryptedBudget(dmk) {
		const { data: existingEncrypted } = await supabase.from('budgets_encrypted').select('category_id').eq('user_id', session.user.id).limit(1);
		if (existingEncrypted && existingEncrypted.length > 0) return;

		const { data: legacyBudgets } = await supabase.from('budgets').select('category_id').eq('user_id', session.user.id).limit(1);
		if (legacyBudgets && legacyBudgets.length > 0) return;

		const payload = {
			category: 'Personal Corpus',
			description: 'Unallocated personal funds',
			limit_amount: 0,
			icon_name: 'wallet',
			budget_type: 'corpus',
			period_type: 'monthly',
			reset_date: 1,
			sort_order: 0
		};
		const encryptedData = await encryptData(payload, dmk);
		await supabase.from('budgets_encrypted').insert({
			category_id: crypto.randomUUID(),
			user_id: session.user.id,
			encrypted_data: encryptedData
		});
	}

	/**
	 * @param {CryptoKey} dmk
	 */
	async function migrateLegacyData(dmk) {
		const { data: legacyBudgets } = await supabase.from('budgets').select('*').eq('user_id', session.user.id);
		const { data: legacyTransactions } = await supabase.from('transactions').select('*').eq('user_id', session.user.id);

		if ((!legacyBudgets || legacyBudgets.length === 0) && (!legacyTransactions || legacyTransactions.length === 0)) {
			return; // nothing to migrate
		}

		isProcessing = true;
		successMsg = "Migrating legacy data to encrypted storage... Please wait.";

		if (legacyBudgets && legacyBudgets.length > 0) {
			const encryptedBudgets = await Promise.all(legacyBudgets.map(async (b) => {
				const payload = { ...b };
				delete payload.id;
				delete payload.category_id;
				delete payload.current_period_start;
				delete payload.user_id;
				delete payload.created_at;
				const enc = await encryptData(payload, dmk);
				return { category_id: b.category_id, user_id: session.user.id, encrypted_data: enc };
			}));
			
			// batch insert to budgets_encrypted
			// we must insert them one by one or in batches if there are many. Let's just do a big insert array.
			await supabase.from('budgets_encrypted').insert(encryptedBudgets);
		}

		if (legacyTransactions && legacyTransactions.length > 0) {
			const encryptedTxs = await Promise.all(legacyTransactions.map(async (tx) => {
				const payload = { ...tx };
				delete payload.id;
				delete payload.user_id;
				delete payload.created_at;
				const enc = await encryptData(payload, dmk);
				return { id: tx.id, user_id: session.user.id, encrypted_data: enc };
			}));
			
			// batch insert. supabase insert has a max payload limit but for typical user (few thousand tx) it's fine.
			// Let's chunk it just in case.
			const chunkSize = 500;
			for (let i = 0; i < encryptedTxs.length; i += chunkSize) {
				const chunk = encryptedTxs.slice(i, i + chunkSize);
				await supabase.from('transactions_encrypted').insert(chunk);
			}
			await supabase.from('transactions').delete().eq('user_id', session.user.id);
		}

		// Delete budgets AFTER transactions to prevent foreign key constraint violations
		if (legacyBudgets && legacyBudgets.length > 0) {
			await supabase.from('budgets').delete().eq('user_id', session.user.id);
		}
		
		successMsg = "Migration complete.";
	}
</script>

<div class="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-gray-300 font-sans">
	{#if loading}
		<div class="h-8 w-8 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"></div>
	{:else if showSetupMode}
		<div class="w-full max-w-sm">
			<div class="mb-12 text-center">
				<Shield class="w-12 h-12 text-green-500 mx-auto mb-4" />
				<h1 class="text-4xl text-white tracking-wide mb-2 font-display uppercase">Secure Vault</h1>
				<p class="text-gray-400 text-sm">Create a Secondary PIN to encrypt your data. This ensures you can access your vault even if biometrics fail.</p>
			</div>

			<form onsubmit={handleEncryptionSetup} class="space-y-6">
				{#if errorMsg}
					<div class="p-4 bg-[#1a0f0f] border border-[#331818] rounded-3xl text-[#ff8080] text-sm text-center font-medium box-3d">{errorMsg}</div>
				{/if}
				{#if successMsg}
					<div class="p-4 bg-[#0f1a0f] border border-[#183318] rounded-3xl text-[#80ff80] text-sm text-center font-medium box-3d">{successMsg}</div>
				{/if}

				<div>
					<label for="setupPin" class="block text-xs uppercase tracking-wider text-gray-500 mb-2 pl-1">Secondary PIN</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<KeyRound class="h-5 w-5 text-gray-600" />
						</div>
						<input id="setupPin" type="password" bind:value={setupPin} required minlength="6"
							class="w-full bg-[#0a0a0a] border border-gray-800 rounded-3xl pl-12 pr-4 py-5 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-light"
							placeholder="Min. 6 characters" />
					</div>
				</div>

				<div>
					<label for="confirmPin" class="block text-xs uppercase tracking-wider text-gray-500 mb-2 pl-1">Confirm PIN</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<KeyRound class="h-5 w-5 text-gray-600" />
						</div>
						<input id="confirmPin" type="password" bind:value={confirmPin} required minlength="6"
							class="w-full bg-[#0a0a0a] border border-gray-800 rounded-3xl pl-12 pr-4 py-5 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-light"
							placeholder="••••••" />
					</div>
				</div>

				<button type="submit" disabled={isProcessing}
					class="w-full mt-4 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium py-5 text-lg rounded-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed box-3d flex justify-center items-center gap-2">
					{isProcessing ? 'Encrypting...' : 'Secure & Continue'}
				</button>
			</form>
		</div>
	{:else if showUnlockMode}
		<div class="w-full max-w-sm relative">
			{#if fallbackMode}
			<div class="absolute inset-0 bg-black/40 backdrop-blur-sm z-[110] flex flex-col items-center justify-center -m-6 p-6">
				<div class="bg-[#151515] w-full rounded-3xl p-6 box-3d shadow-2xl flex flex-col gap-6">
					
					<div>
						<h2 class="text-2xl font-display text-white tracking-wide">Enter PIN</h2>
						<p class="text-gray-400 text-sm mt-1 leading-relaxed">
							Biometrics unavailable. Use your fallback PIN to unlock the vault.
						</p>
					</div>

					<form onsubmit={handlePinUnlock} class="flex flex-col gap-5">
						{#if errorMsg}
							<div class="p-3 bg-[#1a0f0f] border border-[#331818] rounded-xl text-[#ff8080] text-sm text-center font-medium">{errorMsg}</div>
						{/if}
						<div>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Lock class="h-5 w-5 text-gray-600" />
								</div>
								<input id="unlockPin" type="password" bind:value={unlockPin} required
									class="w-full bg-[#0a0a0a] border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-light"
									placeholder="••••••" />
							</div>
						</div>
						<div class="flex gap-4">
							<button type="button" onclick={() => fallbackMode = false} class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:translate-y-1">Cancel</button>
							<button type="submit" disabled={isProcessing}
								class="flex-1 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold box-3d tracking-wide transition-all active:translate-y-1">
								{isProcessing ? 'Unlocking' : 'Unlock'}
							</button>
						</div>
					</form>
				</div>
			</div>
			{/if}

			<div class="mb-12 text-center transition-all duration-300" class:opacity-30={fallbackMode} class:blur-sm={fallbackMode}>
				<Shield class="w-12 h-12 text-green-500 mx-auto mb-4" />
				<h1 class="text-4xl text-white tracking-wide mb-2 font-display uppercase">Secure Unlock</h1>
				<p class="text-gray-400 text-sm">Please authenticate with your Passkey to decrypt your local data.</p>
			</div>
			
			<div class="text-center transition-all duration-300" class:opacity-30={fallbackMode} class:blur-sm={fallbackMode}>
				<button onclick={attemptWebAuthnUnlock} type="button" class="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium py-5 text-lg rounded-3xl transition-all box-3d flex justify-center items-center gap-2">
					Use Biometrics / Passkey
				</button>
				<button onclick={() => fallbackMode = true} class="mt-6 text-sm text-gray-500 hover:text-white transition-colors">
					Use Secondary PIN
				</button>
			</div>
		</div>
	{/if}
</div>
