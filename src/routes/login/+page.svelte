<script>
	/**
	 * @fileoverview Login Page.
	 * Handles user authentication using Supabase email/password sign in.
	 */
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { Mail, Lock } from 'lucide-svelte';

	/** @type {string} User email input binding */
	let email = $state('');
	
	/** @type {string} User password input binding */
	let password = $state('');
	
	/** @type {string} Error message string to display to the user */
	let errorMsg = $state('');
	
	/** @type {boolean} Form submission loading state */
	let loading = $state(false);

	/**
	 * @description Handles form submission and triggers Supabase authentication.
	 * @param {Event} e - Form submission event
	 */
	async function handleLogin(e) {
		e.preventDefault();
		loading = true;
		errorMsg = '';

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			errorMsg = error.message;
		} else {
			goto('/');
		}
		loading = false;
	}
</script>

<div
	class="flex flex-col items-center justify-center min-h-screen p-6 bg-black text-gray-300 font-sans"
>
	<div class="w-full max-w-sm">
		<div class="mb-12 text-center">
			<h1 class="text-3xl font-light text-white tracking-widest uppercase mb-3">Green Bar</h1>
			<p class="text-gray-500 text-sm">Sign in to track your expenses</p>
		</div>

		<form onsubmit={handleLogin} class="space-y-6">
			{#if errorMsg}
				<div
					class="p-4 bg-[#1a0f0f] border border-[#331818] rounded-3xl text-[#ff8080] text-sm text-center font-medium"
				>
					{errorMsg}
				</div>
			{/if}

			<div>
				<label for="email" class="block text-xs uppercase tracking-wider text-gray-500 mb-2 pl-1"
					>Email</label
				>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<Mail class="h-5 w-5 text-gray-600" />
					</div>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full bg-[#0a0a0a] border border-gray-800 rounded-3xl pl-12 pr-4 py-5 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-light"
						placeholder="you@example.com"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="block text-xs uppercase tracking-wider text-gray-500 mb-2 pl-1"
					>Password</label
				>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<Lock class="h-5 w-5 text-gray-600" />
					</div>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="w-full bg-[#0a0a0a] border border-gray-800 rounded-3xl pl-12 pr-4 py-5 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-light"
						placeholder="••••••••"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full mt-4 bg-gray-200 hover:bg-white text-black font-medium py-5 text-lg rounded-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
			>
				{loading ? 'Authenticating...' : 'Sign In'}
			</button>
		</form>
	</div>
</div>
