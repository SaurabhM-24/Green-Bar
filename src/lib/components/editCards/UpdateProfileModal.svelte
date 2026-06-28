<script>
	import { X } from 'lucide-svelte';
	import { slide, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { supabase } from '$lib/supabase';

	let { onclose, onsave = () => {} } = $props();

	let loading = $state(true);
	let saving = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');
	let showConfirmation = $state(false);

	let profileData = $state({
		first_name: '',
		last_name: '',
		email: '',
		password: ''
	});

	/** @type {string} */
	let originalEmail = $state('');
	/** @type {string | null} */
	let userId = $state(null);

	$effect(() => {
		async function fetchProfile() {
			try {
				const {
					data: { user },
					error: authError
				} = await supabase.auth.getUser();
				if (authError) throw authError;
				if (user) {
					userId = user.id;
					profileData.email = user.email || '';
					originalEmail = user.email || '';

					const { data: profile, error: profileError } = await supabase
						.from('profiles')
						.select('first_name, last_name')
						.eq('id', user.id)
						.single();

					if (profileError && profileError.code !== 'PGRST116') {
						throw profileError; // PGRST116 is no rows returned, which might be fine if profile doesn't exist yet
					}

					if (profile) {
						profileData.first_name = profile.first_name || '';
						profileData.last_name = profile.last_name || '';
					}
				}
			} catch (err) {
				const error = /** @type {Error} */ (err);
				errorMsg = 'Failed to load profile data: ' + error.message;
			} finally {
				loading = false;
			}
		}
		fetchProfile();
	});

	function handlePreSave() {
		errorMsg = '';
		successMsg = '';
		if (!profileData.first_name) {
			errorMsg = 'First name is required.';
			return;
		}
		if (!profileData.email) {
			errorMsg = 'Email is required.';
			return;
		}
		showConfirmation = true;
	}

	async function handleSave() {
		saving = true;
		errorMsg = '';
		successMsg = '';

		try {
			// Update profile table
			if (userId) {
				const { error: profileError } = await supabase.from('profiles').upsert({
					id: userId,
					first_name: profileData.first_name,
					last_name: profileData.last_name
				});

				if (profileError) throw profileError;
			}

			// Update auth if email or password changed
			/** @type {{email?: string, password?: string}} */
			let authUpdateData = {};
			if (profileData.email !== originalEmail) {
				authUpdateData.email = profileData.email;
			}
			if (profileData.password) {
				authUpdateData.password = profileData.password;
			}

			if (Object.keys(authUpdateData).length > 0) {
				const { error: authUpdateError } = await supabase.auth.updateUser(authUpdateData);
				if (authUpdateError) throw authUpdateError;

				if (authUpdateData.email) {
					successMsg =
						'Profile updated! IMPORTANT: For security reasons, you must verify this change. Please check BOTH your old and new email inboxes and click the confirmation links in both to finalize the email change.';
				} else {
					successMsg = 'Profile updated successfully!';
				}
			} else {
				successMsg = 'Profile updated successfully!';
			}

			if (authUpdateData.email) {
				setTimeout(() => {
					onclose();
					if (onsave) onsave();
				}, 10000);
			} else {
				setTimeout(() => {
					onclose();
					if (onsave) onsave();
				}, 2000);
			}
		} catch (err) {
			const error = /** @type {Error} */ (err);
			errorMsg = error.message || 'Failed to update profile.';
			showConfirmation = false;
		} finally {
			saving = false;
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
					<h2 class="text-3xl tracking-wide text-white font-display">Update Profile</h2>
					<p class="text-sm text-gray-400">Manage your personal information and credentials.</p>
				</div>
				<button
					class="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors bg-[#222] rounded-xl box-3d shrink-0 z-50"
					onclick={onclose}
					disabled={saving}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			{#if loading}
				<div class="flex justify-center py-8">
					<div
						class="h-8 w-8 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
					></div>
				</div>
			{:else if showConfirmation}
				<!-- Confirmation View -->
				<div class="flex flex-col gap-4 py-4" transition:slide={{ duration: 200 }}>
					<p class="text-gray-200 text-lg text-center font-medium">
						Are you sure you want to save these changes?
					</p>
					<div class="bg-[#1a1a1a] rounded-xl p-4 mt-2">
						<ul class="text-gray-400 text-sm space-y-2">
							<li>
								<span class="text-gray-500 w-20 inline-block">Name:</span>
								{profileData.first_name}
								{profileData.last_name}
							</li>
							<li>
								<span class="text-gray-500 w-20 inline-block">Email:</span>
								{profileData.email}
							</li>
							{#if profileData.password}
								<li>
									<span class="text-gray-500 w-20 inline-block">Password:</span> •••••••• (will be changed)
								</li>
							{/if}
						</ul>
					</div>
				</div>

				{#if errorMsg}
					<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
						{errorMsg}
					</div>
				{/if}

				<!-- Actions -->
				<div class="mt-2 border-t border-gray-800/60 pt-6 flex gap-4">
					<button
						class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]"
						onclick={() => (showConfirmation = false)}
						disabled={saving}>Back</button
					>
					<button
						class="flex-1 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						onclick={handleSave}
						disabled={saving}
					>
						{#if saving}
							<div
								class="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin"
							></div>
						{:else}
							Confirm Save
						{/if}
					</button>
				</div>
			{:else}
				<!-- Form View -->
				<div class="flex flex-col gap-5 mt-2" transition:slide={{ duration: 200 }}>
					<div class="flex gap-4">
						<div class="flex-1 flex flex-col gap-1.5 mt-1">
							<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold"
								>First Name</span
							>
							<input
								bind:value={profileData.first_name}
								class="bg-transparent text-white text-lg focus:outline-none w-full p-0 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1"
								placeholder="Jane"
							/>
						</div>
						<div class="flex-1 flex flex-col gap-1.5 mt-1">
							<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold"
								>Last Name</span
							>
							<input
								bind:value={profileData.last_name}
								class="bg-transparent text-white text-lg focus:outline-none w-full p-0 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1"
								placeholder="Doe"
							/>
						</div>
					</div>

					<div class="flex flex-col gap-1.5 mt-1">
						<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold"
							>Email Address</span
						>
						<input
							type="email"
							bind:value={profileData.email}
							class="bg-transparent text-white text-lg focus:outline-none w-full p-0 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1"
							placeholder="jane@example.com"
						/>
					</div>

					<div class="flex flex-col gap-1.5 mt-1">
						<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold"
							>New Password <span class="lowercase normal-case font-normal text-gray-600"
								>(leave blank to keep current)</span
							></span
						>
						<input
							type="password"
							bind:value={profileData.password}
							class="bg-transparent text-white text-lg focus:outline-none w-full p-0 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1"
							placeholder="••••••••"
						/>
					</div>
				</div>

				{#if errorMsg}
					<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
						{errorMsg}
					</div>
				{/if}

				{#if successMsg}
					<div
						class="p-4 rounded-xl {successMsg.includes('IMPORTANT')
							? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
							: 'bg-green-500/10 border border-green-500/20 text-green-400'} text-sm leading-relaxed"
					>
						{successMsg}
					</div>
				{/if}

				<!-- Actions -->
				<div class="mt-2 border-t border-gray-800/60 pt-6 flex gap-4">
					<button
						class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]"
						onclick={onclose}
						disabled={saving}>Cancel</button
					>
					<button
						class="flex-1 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						onclick={handlePreSave}
						disabled={saving}
					>
						Save Changes
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
