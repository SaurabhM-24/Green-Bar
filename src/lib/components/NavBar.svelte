<script>
	import { Home, LayoutDashboard, Wallet, List } from 'lucide-svelte';
	import { page } from '$app/stores';

	let activeRoute = $derived($page.url.pathname);

	const links = [
		{ href: '/', icon: Home, label: 'Home' },
		{ href: '/variable', icon: LayoutDashboard, label: 'Dash' },
		{ href: '/fixed', icon: Wallet, label: 'Fixed' },
		{ href: '/list', icon: List, label: 'List' }
	];
</script>

<nav
	class="fixed bottom-8 left-6 right-6 h-[100px] bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[2rem] flex justify-around items-center z-50 px-4 box-3d"
>
	{#each links as link}
		<a
			href={link.href}
			class="relative flex flex-col items-center justify-center w-24 h-20 rounded-[1.5rem] transition-all"
		>
			{#if activeRoute === link.href}
				<div class="absolute -top-1 w-12 h-1.5 bg-white rounded-full"></div>
			{/if}

			<link.icon
				class="w-8 h-8 transition-all {activeRoute === link.href
					? 'text-white'
					: 'text-gray-500 hover:text-gray-400'}"
				strokeWidth={activeRoute === link.href ? 2.5 : 2}
			/>
		</a>
	{/each}
</nav>
