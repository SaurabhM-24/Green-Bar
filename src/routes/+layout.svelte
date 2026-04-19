<script>
	import favicon from '$lib/assets/favicon.svg';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import '../app.css';

	let { children } = $props();

	let session = $state(null);
	let loading = $state(true);

	$effect(() => {
		supabase.auth.getSession().then(({ data }) => {
			session = data.session;
			loading = false;
			if (!session && $page.url.pathname !== '/login') {
				goto('/login');
			}
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
			loading = false;
			if (!session && $page.url.pathname !== '/login') {
				goto('/login');
			} else if (session && $page.url.pathname === '/login') {
				goto('/');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
		<main class="flex-1 overflow-y-auto mt-[88px] mb-[104px] scroll-smooth p-3">
			{@render children()}
		</main>

		<!-- NavBar -->
		<NavBar />
	</div>
{:else}
	{@render children()}
{/if}
