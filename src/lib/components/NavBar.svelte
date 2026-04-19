<script>
	import { LayoutDashboard, Wallet, List, Plus } from 'lucide-svelte';
	import { page } from '$app/stores';

	let activeRoute = $derived($page.url.pathname);

	const links = [
		{ href: '/', icon: LayoutDashboard, label: 'Dash' },
		{ href: '/fixed', icon: Wallet, label: 'Fixed' },
		{ href: '/list', icon: List, label: 'List' },
		{ href: '/add', icon: Plus, label: 'Add', special: true }
	];
</script>

<nav
	class="fixed bottom-0 w-full h-[104px] bg-[#0a0a0a]/90 backdrop-blur-3xl border-t border-gray-900 flex justify-around items-center pb-safe box-border z-50 px-2"
>
	{#each links as link}
		<a
			href={link.href}
			class="relative flex flex-col items-center justify-center w-20 h-16 rounded-2xl transition-all"
		>
			{#if activeRoute === link.href && !link.special}
				<div class="absolute -top-1 w-12 h-1.5 bg-white rounded-full"></div>
			{/if}

			<link.icon
				class="w-7 h-7 transition-all {link.special
					? 'w-8 h-8 text-black'
					: activeRoute === link.href
						? 'text-white'
						: 'text-gray-500 hover:text-gray-400'}"
				strokeWidth={activeRoute === link.href ? 2.5 : 2}
			/>

			{#if link.special}
				<div
					class="absolute -z-10 w-[60px] h-[60px] bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.15)] {activeRoute ===
					link.href
						? 'scale-110'
						: ''}"
				></div>
			{/if}
		</a>
	{/each}
</nav>
