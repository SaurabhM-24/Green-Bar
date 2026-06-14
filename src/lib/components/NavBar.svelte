<script>
	/**
	 * @fileoverview Bottom Navigation Bar.
	 * Provides persistent global navigation across core application routes.
	 */
	import { Home, LayoutDashboard, Wallet, List } from 'lucide-svelte';
	import { page } from '$app/stores';

	/** @type {string} Derived current active route to highlight the corresponding icon */
	let activeRoute = $derived($page.url.pathname);

	/** @type {{ href: string, icon: any, label: string }[]} Navigation link configuration */
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
			<link.icon
				class="w-8 h-8 transition-transform duration-300 {activeRoute === link.href
					? 'text-white scale-125'
					: 'text-gray-500 hover:text-gray-400 scale-90'}"
				strokeWidth={activeRoute === link.href ? 2.5 : 2}
			/>
		</a>
	{/each}
</nav>
