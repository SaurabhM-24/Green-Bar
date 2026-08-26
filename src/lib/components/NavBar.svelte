<script>
	/**
	 * @fileoverview Bottom Navigation Bar.
	 * Provides persistent global navigation across core application routes.
	 */
	import { Home, ChartNoAxesGantt, ListChecks, ClipboardClock, PieChart } from 'lucide-svelte';
	import { page } from '$app/stores';

	/** @type {string} Derived current active route to highlight the corresponding icon */
	let activeRoute = $derived($page.url.pathname);

	/** @type {{ href: string, icon: any, label: string }[]} Navigation link configuration */
	const links = [
		{ href: '/', icon: Home, label: 'Home' },
		{ href: '/variable', icon: ChartNoAxesGantt, label: 'Variables' },
		{ href: '/fixed', icon: ListChecks, label: 'Fixed' },
		{ href: '/balance', icon: PieChart, label: 'Balance' },
		{ href: '/list', icon: ClipboardClock, label: 'History' }
	];
</script>

<nav
	class="fixed bottom-8 left-4 right-4 h-[90px] bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[2rem] flex justify-between items-center z-50 px-2 box-3d"
>
	{#each links as link}
		<a
			href={link.href}
			class="relative flex flex-col items-center justify-center flex-1 h-full rounded-[1.5rem] transition-all gap-1"
		>
			<link.icon
				class="w-6 h-6 transition-transform duration-300 {activeRoute === link.href
					? 'text-white scale-125'
					: 'text-gray-500 hover:text-gray-400 scale-100'}"
				strokeWidth={activeRoute === link.href ? 2.5 : 2}
			/>
			<span
				class="text-[11px] font-sans tracking-wide transition-colors duration-300 {activeRoute ===
				link.href
					? 'text-white'
					: 'text-gray-500'}"
			>
				{link.label}
			</span>
		</a>
	{/each}
</nav>
