<script>
	import { X, KeyRound, Fingerprint } from 'lucide-svelte';
	import { slide, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { supabase } from '$lib/supabase';
	import { cryptoStore } from '$lib/cryptoStore.svelte';
	import { 
		generateRandomBytes, 
		deriveKEKFromPIN, 
		encryptData, 
		registerWebAuthnPRF, 
		exportKey,
		importRawKey,
		bufferToBase64,
		base64ToBuffer
	} from '$lib/crypto';
	import { onMount } from 'svelte';

	let { onclose } = $props();

	let loading = $state(true);
	let savingPin = $state(false);
	let savingBiometrics = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	let newPin = $state('');
	let confirmPin = $state('');

	/** @type {string | null} */
	let userId = $state(null);
	/** @type {string} */
	let userName = $state('User');

	onMount(async () => {
		try {
			const { data: { user }, error: authError } = await supabase.auth.getUser();
			if (authError) throw authError;
			if (user) {
				userId = user.id;
				userName = user.user_metadata?.first_name || user.email || 'User';
			}
		} catch (err) {
			const error = /** @type {Error} */ (err);
			errorMsg = 'Failed to load user session: ' + error.message;
		} finally {
			loading = false;
		}
	});

	async function handleSavePin() {
		errorMsg = '';
		successMsg = '';

		if (!cryptoStore.isUnlocked || !cryptoStore.dmk) {
			errorMsg = 'Vault is locked. Cannot update PIN.';
			return;
		}
		if (newPin !== confirmPin) {
			errorMsg = 'PINs do not match.';
			return;
		}
		if (newPin.length < 6) {
			errorMsg = 'PIN must be at least 6 characters long.';
			return;
		}

		savingPin = true;

		try {
			// Generate new KEK
			const pinSalt = generateRandomBytes(16);
			const pinKek = await deriveKEKFromPIN(newPin, /** @type {ArrayBuffer} */ (pinSalt.buffer));

			// Export and encrypt DMK
			const rawDmk = await exportKey(cryptoStore.dmk);
			const base64Dmk = bufferToBase64(rawDmk);
			const encryptedDmkPin = await encryptData(base64Dmk, pinKek);

			// Delete old PIN
			if (userId) {
				const { error: deleteError } = await supabase
					.from('user_keys')
					.delete()
					.eq('user_id', userId)
					.eq('key_type', 'pin');
				
				if (deleteError) throw deleteError;

				// Insert new PIN
				const { error: insertError } = await supabase
					.from('user_keys')
					.insert({
						user_id: userId,
						key_type: 'pin',
						salt: bufferToBase64(/** @type {ArrayBuffer} */ (pinSalt.buffer)),
						encrypted_dmk: encryptedDmkPin
					});

				if (insertError) throw insertError;

				successMsg = 'PIN updated successfully!';
				newPin = '';
				confirmPin = '';
				
				setTimeout(() => {
					onclose();
				}, 2000);
			}
		} catch (err) {
			const error = /** @type {Error} */ (err);
			errorMsg = error.message || 'Failed to update PIN.';
		} finally {
			savingPin = false;
		}
	}

	async function handleUpdateBiometrics() {
		errorMsg = '';
		successMsg = '';

		if (!cryptoStore.isUnlocked || !cryptoStore.dmk) {
			errorMsg = 'Vault is locked. Cannot update biometrics.';
			return;
		}

		savingBiometrics = true;

		try {
			if (userId) {
				const { data: existingPasskeys } = await supabase
					.from('user_keys')
					.select('salt')
					.eq('user_id', userId)
					.eq('key_type', 'passkey')
					.limit(1);
					
				let existingSaltBuffer = null;
				if (existingPasskeys && existingPasskeys.length > 0) {
					existingSaltBuffer = base64ToBuffer(existingPasskeys[0].salt);
				}

				const userIdBuffer = new TextEncoder().encode(userId);
				const { prfSupported, prfKey, prfSalt } = await registerWebAuthnPRF(userName, userIdBuffer, existingSaltBuffer);

				if (prfSupported && prfKey) {
					const passkeyKek = await importRawKey(prfKey);
					
					// Export and encrypt DMK
					const rawDmk = await exportKey(cryptoStore.dmk);
					const base64Dmk = bufferToBase64(rawDmk);
					const encryptedDmkPasskey = await encryptData(base64Dmk, passkeyKek);

					const { error: insertError } = await supabase
						.from('user_keys')
						.insert({
							user_id: userId,
							key_type: 'passkey',
							salt: bufferToBase64(/** @type {ArrayBuffer} */ (prfSalt)),
							encrypted_dmk: encryptedDmkPasskey
						});

					if (insertError) throw insertError;

					successMsg = 'Device biometrics added successfully!';
					
					setTimeout(() => {
						onclose();
					}, 2000);
				} else if (prfSupported && !prfKey) {
					errorMsg = "WebAuthn supported, but PRF extension failed to initialize on this device.";
				} else {
					errorMsg = "WebAuthn PRF is not supported on this device/browser.";
				}
			}
		} catch (err) {
			console.error(err);
			const error = /** @type {Error} */ (err);
			errorMsg = error.message || 'Failed to update biometrics.';
		} finally {
			savingBiometrics = false;
		}
	}
</script>

<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overflow-y-auto"
	role="presentation"
>
	<div class="min-h-full flex items-center justify-center p-4">
		<!-- Modal Content -->
		<div
			transition:scale={{ start: 0.95, duration: 250, easing: cubicOut }}
			class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- Top Bar -->
			<div class="flex justify-between items-start gap-4">
				<div class="flex flex-col gap-1 w-full">
					<h2 class="text-3xl tracking-wide text-white font-display">Update Security</h2>
					<p class="text-sm text-gray-400">Change your PIN or add a new biometric device.</p>
				</div>
				<button
					class="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors bg-[#222] rounded-xl box-3d shrink-0 z-50"
					onclick={onclose}
					disabled={savingPin || savingBiometrics}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			{#if loading}
				<div class="flex justify-center py-8">
					<div class="h-8 w-8 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"></div>
				</div>
			{:else}
				<div class="flex flex-col gap-6 mt-2" transition:slide={{ duration: 200 }}>
					<!-- Change PIN Section -->
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-1.5 mt-1">
							<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">New PIN</span>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<KeyRound class="h-4 w-4 text-gray-600" />
								</div>
								<input
									type="password"
									bind:value={newPin}
									class="w-full bg-[#0a0a0a] border border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-lg text-white placeholder-gray-700 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-light"
									placeholder="Min. 6 characters"
								/>
							</div>
						</div>

						<div class="flex flex-col gap-1.5 mt-1">
							<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Confirm New PIN</span>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<KeyRound class="h-4 w-4 text-gray-600" />
								</div>
								<input
									type="password"
									bind:value={confirmPin}
									class="w-full bg-[#0a0a0a] border border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-lg text-white placeholder-gray-700 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-light"
									placeholder="••••••"
								/>
							</div>
						</div>

						<button
							class="w-full py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
							onclick={handleSavePin}
							disabled={savingPin || savingBiometrics}
						>
							{#if savingPin}
								<div class="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
							{:else}
								Save New PIN
							{/if}
						</button>
					</div>

					<!-- Divider -->
					<div class="relative flex py-2 items-center">
						<div class="flex-grow border-t border-gray-800"></div>
						<span class="flex-shrink-0 mx-4 text-gray-500 text-xs font-semibold tracking-wider">OR</span>
						<div class="flex-grow border-t border-gray-800"></div>
					</div>

					<!-- Biometrics Section -->
					<button
						class="w-full py-4 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-3"
						onclick={handleUpdateBiometrics}
						disabled={savingPin || savingBiometrics}
					>
						{#if savingBiometrics}
							<div class="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
						{:else}
							<Fingerprint class="w-5 h-5" />
							Update Device Biometrics
						{/if}
					</button>
				</div>

				{#if errorMsg}
					<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-2">
						{errorMsg}
					</div>
				{/if}

				{#if successMsg}
					<div class="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm leading-relaxed mt-2">
						{successMsg}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
