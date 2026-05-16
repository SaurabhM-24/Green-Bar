<script>
	import { Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { appState } from '$lib/state.svelte.js';

	let isDropdownOpen = $state(false);

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function prevMonth() {
		appState.prevMonth();
	}

	function nextMonth() {
		appState.nextMonth();
	}
</script>

<header
	class="fixed top-8 left-6 right-6 h-[90px] bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-[2rem] flex items-center justify-between px-8 z-50 box-3d"
>
	<div class="flex items-center gap-3">
		<h2 class="text-3xl tracking-wide text-white">
			{appState.monthName}, <span class="text-gray-400">{appState.year}</span>
		</h2>
	</div>

	<button
		onclick={toggleDropdown}
		class="p-2 text-gray-400 hover:text-white transition-colors"
	>
		<Calendar class="w-6 h-6" />
	</button>
</header>

{#if isDropdownOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
		onclick={toggleDropdown}
		aria-hidden="true"
	></div>

	<!-- Modal -->
	<div
		class="fixed top-36 right-6 w-72 bg-[#111111] rounded-3xl p-7 box-3d z-[70] transform transition-all"
	>
		<div class="flex items-center justify-between mb-4">
			<button
				onclick={prevMonth}
				class="p-2 hover:bg-[#1a1a1a] rounded-full text-gray-400 hover:text-white transition-colors"
			>
				<ChevronLeft class="w-5 h-5" />
			</button>
			<span class="tracking-widest text-lg text-white">{appState.year}</span>
			<button
				onclick={nextMonth}
				class="p-2 hover:bg-[#1a1a1a] rounded-full text-gray-400 hover:text-white transition-colors"
			>
				<ChevronRight class="w-5 h-5" />
			</button>
		</div>

		<div class="grid grid-cols-3 gap-2">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as m}
				<button
					class="py-2 text-base tracking-wide rounded-xl transition-all {appState.month === m
						? 'bg-white text-black'
						: 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}"
					onclick={() => {
						appState.month = m;
						isDropdownOpen = false;
					}}
				>
					{new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
				</button>
			{/each}
		</div>
	</div>
{/if}
