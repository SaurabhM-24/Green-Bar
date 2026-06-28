<script>
	/**
	 * @fileoverview Root layout component
	 * Handles global authentication state, layout structure, and automatic route protection.
	 */
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import { Plus } from 'lucide-svelte';
	import { appState } from '$lib/state.svelte.js';
	import { appData } from '$lib/data.svelte.js';
	import TutorialOverlay from '$lib/components/TutorialOverlay.svelte';
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();

	/** @type {import('@supabase/supabase-js').Session | null} Active user session */
	let session = $state(null);

	/** @type {boolean} Global loading state for authentication check */
	let loading = $state(true);

	let showTutorial = $state(false);

	/** @type {HTMLElement | undefined} Reference to the main scrolling container */
	let mainContainer = $state();

	onMount(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && session) {
				appData.loadData(true); // background refresh
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
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
					goto('/landing');
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

			if (!isCompleted && $page.url.pathname !== '/welcome') {
				goto('/welcome');
			} else if (isCompleted && (publicRoutes.includes($page.url.pathname) || $page.url.pathname === '/welcome')) {
				goto('/');
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
		if (session) {
			appData.loadData();
		}
	});

	$effect(() => {
		const path = $page.url.pathname;
		
		async function checkTutorial() {
			if (typeof localStorage !== 'undefined') {
				if (localStorage.getItem('tutorial_shown') === 'true') return;
			}
			if (!session) return;

			const { data, error } = await supabase
				.from('profiles')
				.select('onboarding_completed')
				.eq('id', session.user.id)
				.single();

			if (!error && data?.onboarding_completed) {
				showTutorial = true;
			}
		}

		if (session && path === '/') {
			checkTutorial();
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
			{@render children()}
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
				onComplete={() => {
					showTutorial = false;
					if (typeof localStorage !== 'undefined') {
						localStorage.setItem('tutorial_shown', 'true');
					}
				}}
			/>
		{/if}
	</div>
{:else}
	{@render children()}
{/if}
