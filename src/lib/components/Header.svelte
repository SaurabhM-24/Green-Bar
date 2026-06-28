<script>
	/**
	 * @fileoverview Header Component.
	 * Displays the current global month/year and provides a dropdown menu.
	 */
	import {
		Settings,
		Calendar,
		User,
		LogOut,
		ChevronLeft,
		ChevronRight,
		ArrowLeft
	} from 'lucide-svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { clickOutside } from '$lib/actions/clickOutside.js';
	import UpdateProfileModal from '$lib/components/editCards/UpdateProfileModal.svelte';
	import { supabase } from '$lib/supabase';

	/** @type {boolean} State to control the visibility of the dropdown menu */
	let isDropdownOpen = $state(false);
	let isUpdateProfileModalOpen = $state(false);
	let showLogoutConfirm = $state(false);
	/** @type {HTMLElement | null} */
	let headerBtn = $state(null);

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	async function confirmLogout() {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			window.location.href = '/login';
		}
	}
</script>

<button
	id="app-header"
	bind:this={headerBtn}
	onclick={toggleDropdown}
	class="fixed top-8 left-6 right-6 h-[90px] bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-[2rem] flex items-center justify-between px-8 z-50 box-3d hover:bg-[#111111]/90 transition-colors cursor-pointer text-left focus:outline-none w-[calc(100%-3rem)]"
	aria-label="Open Menu"
>
	<div class="flex items-center gap-3">
		<h2 class="text-3xl tracking-wide text-white font-display">
			Green <span class="text-gray-400">Bar</span>
		</h2>
	</div>

	<div class="p-2 text-gray-400 hover:text-white transition-colors">
		<Settings class="w-6 h-6" />
	</div>
</button>

{#if isDropdownOpen}
	<!-- Modal -->
	<div
		use:clickOutside={{
			enabled: !isUpdateProfileModalOpen && !showLogoutConfirm,
			ignore: headerBtn,
			handler: () => {
				isDropdownOpen = false;
			}
		}}
		class="fixed top-36 left-6 right-6 w-[calc(100%-3rem)] bg-[#111111] rounded-3xl p-3 box-3d z-[70] transform overflow-hidden"
		transition:slide={{ duration: 300 }}
	>
		<div
			class="flex flex-col gap-1"
			in:fly={{ x: -20, duration: 200, delay: 200 }}
			out:fly={{ x: -20, duration: 200 }}
		>
			<button
				class="w-full flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide text-gray-200 hover:bg-[#2a2a2a] rounded-xl transition-colors"
				onclick={(e) => {
					e.stopPropagation();
					isUpdateProfileModalOpen = true;
					isDropdownOpen = false;
				}}
			>
				<User class="w-5 h-5 text-gray-400" />
				Update Profile
			</button>
			<hr class="border-gray-800 mx-3 my-1" />
			<button
				class="w-full flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
				onclick={(e) => {
					e.stopPropagation();
					showLogoutConfirm = true;
					isDropdownOpen = false;
				}}
			>
				<LogOut class="w-5 h-5" />
				Logout
			</button>
		</div>
	</div>
{/if}

{#if isUpdateProfileModalOpen}
	<UpdateProfileModal onclose={() => (isUpdateProfileModalOpen = false)} />
{/if}

{#if showLogoutConfirm}
	<div
		class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
	>
		<div
			class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6"
			transition:slide={{ duration: 200 }}
		>
			<h2 class="text-2xl font-display text-white tracking-wide">Confirm Logout</h2>
			<p class="text-gray-400 text-base leading-relaxed">
				Are you sure you want to log out of Green Bar? You will need to sign in again to access your
				expenses.
			</p>
			<div class="flex gap-4 mt-2">
				<button
					class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:translate-y-1"
					onclick={() => (showLogoutConfirm = false)}>Cancel</button
				>
				<button
					class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:translate-y-1"
					onclick={confirmLogout}>Logout</button
				>
			</div>
		</div>
	</div>
{/if}
