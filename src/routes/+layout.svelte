<script>
	/**
	 * @fileoverview Root layout component
	 * Handles global authentication state, layout structure, and automatic route protection.
	 */
	import { supabase } from '$lib/supabase';
	import { goto, beforeNavigate, afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import { Plus } from 'lucide-svelte';
	import { appState } from '$lib/state.svelte.js';
	import { appData } from '$lib/data.svelte.js';
	import TutorialOverlay from '$lib/components/TutorialOverlay.svelte';
	import EncryptionGate from '$lib/components/EncryptionGate.svelte';
	import { cryptoStore } from '$lib/cryptoStore.svelte';
	import { clickOutside } from '$lib/actions/clickOutside.js';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import '../app.css';

	let { children } = $props();

	/** @type {import('@supabase/supabase-js').Session | null} Active user session */
	let session = $state(null);

	/** @type {boolean} Global loading state for authentication check */
	let loading = $state(true);

	let showTutorial = $state(false);
	let showExitModal = $state(false);

	/** @type {HTMLElement | undefined} Reference to the main scrolling container */
	let mainContainer = $state();

	/**
	 * @description Completely closes the app or navigates to a blank page.
	 */
	function closeApp() {
		try {
			if (typeof window !== 'undefined') {
				// Android/Cordova/Capacitor exit app if available
				// @ts-ignore
				if (window.navigator?.app?.exitApp) {
					// @ts-ignore
					window.navigator.app.exitApp();
					return;
				}
				// Standard window.close
				window.close();
				// Self-close trick for tabs
				window.open('', '_self', '');
				window.close();
				// Blank fallback to prevent displaying any remaining app/biometric screen
				window.location.replace('about:blank');
			}
		} catch (err) {
			console.error('Failed to close app:', err);
			window.location.replace('about:blank');
		}
	}

	onMount(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && session && cryptoStore.isUnlocked) {
				appData.loadData(true); // background refresh
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	/**
	 * @description Intercepts popstate (back button) events to enforce:
	 * 1. Back button on any subpage directly redirects to '/' without popping intermediate history.
	 * 2. Back button on '/' opens the Exit Confirmation popup.
	 * 3. Back button while Exit Confirmation is open exits the app completely.
	 */
	beforeNavigate((navigation) => {
		if (!session) return;

		if (navigation.type === 'popstate') {
			const currentPath = $page.url.pathname;

			if (currentPath !== '/') {
				navigation.cancel();
				goto('/', { replaceState: true });
				return;
			}

			// User is on Home page ('/')
			navigation.cancel();

			if (!showExitModal) {
				showExitModal = true;
			} else {
				closeApp();
			}
		}
	});

	afterNavigate(({ to }) => {
		if (to?.url.pathname !== '/') {
			showExitModal = false;
		}
	});

	/**
	 * @description Effect: Scroll to top of the main container when the route changes.
	 */
	$effect(() => {
		const currentPath = $page.url.pathname;
		if (mainContainer) {
			mainContainer.scrollTop = 0;
		}
	});

	/**
	 * @description Effect: Manages Supabase authentication state and route protection.
	 */
	$effect(() => {
		const publicRoutes = ['/login', '/landing'];

		/**
		 * @param {import('@supabase/supabase-js').Session | null} _session
		 */
		async function handleAuthRouting(_session) {
			if (!_session) {
				if (!publicRoutes.includes($page.url.pathname)) {
					goto('/landing', { replaceState: true });
				}
				loading = false;
				return;
			}

			const { data, error } = await supabase
				.from('profiles')
				.select('onboarding_completed')
				.eq('id', _session.user.id)
				.single();

			const isCompleted = !error && data?.onboarding_completed;

			if (isCompleted && publicRoutes.includes($page.url.pathname)) {
				goto('/', { replaceState: true });
			}

			loading = false;
		}

		supabase.auth.getSession().then(({ data }) => {
			session = data.session;
			handleAuthRouting(session);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
			handleAuthRouting(session);
		});

		return () => subscription.unsubscribe();
	});

	/**
	 * @description Effect: Fetches app data whenever the session or selected month/year changes.
	 */
	$effect(() => {
		if (session && cryptoStore.isUnlocked) {
			appData.loadData();
		}
	});

	let tutorialStartStep = $state(1);

	$effect(() => {
		const path = $page.url.pathname;
		
		async function checkTutorial() {
			if (!session) return;

			const { data, error } = await supabase
				.from('profiles')
				.select('onboarding_completed')
				.eq('id', session.user.id)
				.single();

			const isCompleted = !error && data?.onboarding_completed;

			if (!isCompleted) {
				// Must complete welcome flow
				tutorialStartStep = 1;
				showTutorial = true;
			} else {
				showTutorial = false;
			}
		}

		if (session && path === '/') {
			if (cryptoStore.isUnlocked) {
				checkTutorial();
			} else {
				showTutorial = false;
			}
		}
	});
</script>

<svelte:head>
	<title>Green Bar</title>
	<link rel="icon" href="/icon-192x192.png" />
</svelte:head>

{#if loading}
	<div class="min-h-screen bg-black flex items-center justify-center">
		<div
			class="h-8 w-8 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
		></div>
	</div>
{:else if session}
	<div class="h-screen w-full flex flex-col bg-black overflow-hidden relative">
		<!-- Header -->
		<Header />

		<!-- Main Content Area -->
		<main
			bind:this={mainContainer}
			class="flex-1 grid overflow-x-hidden overflow-y-auto mt-[88px] mb-[104px] scroll-smooth p-3"
		>
			{#if !cryptoStore.isUnlocked}
				<EncryptionGate {session} />
			{:else}
				{@render children()}
			{/if}
		</main>

		<!-- NavBar -->
		<NavBar />

		<!-- Floating Action Button -->
		{#if $page.url.pathname !== '/add'}
			<a
				href="/add"
				class="fixed bottom-[140px] right-12 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] box-3d z-50 transition-transform active:scale-95"
			>
				<Plus class="w-8 h-8 text-black" strokeWidth={2.5} />
			</a>
		{/if}

		{#if showTutorial}
			<TutorialOverlay
				startStep={tutorialStartStep}
				onComplete={() => {
					showTutorial = false;
				}}
			/>
		{/if}

		{#if showExitModal}
			<div
				transition:fade={{ duration: 150 }}
				class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
			>
				<div
					use:clickOutside={{ handler: () => (showExitModal = false) }}
					transition:scale={{ start: 0.95, duration: 200, easing: cubicOut }}
					class="bg-[#151515] w-full max-w-sm rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative shadow-2xl"
				>
					<div class="text-center">
						<h2 class="text-2xl font-display text-white tracking-wide">Exit Green Bar?</h2>
						<p class="text-gray-400 text-sm mt-2 leading-relaxed">
							Are you sure you want to exit the application?
						</p>
					</div>

					<div class="flex gap-4 mt-2">
						<button
							type="button"
							class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:translate-y-1"
							onclick={() => (showExitModal = false)}
						>
							No
						</button>
						<button
							type="button"
							class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:translate-y-1"
							onclick={closeApp}
						>
							Yes
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	{@render children()}
{/if}
