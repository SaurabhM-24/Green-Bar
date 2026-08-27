<script>
	/**
	 * @fileoverview Main Dashboard page.
	 * Displays high-level insights, variable expenses overview, fixed responsibilities, and overall balance.
	 */
	import { appData } from '$lib/data.svelte.js';
	import { Check } from 'lucide-svelte';
	import HealthRing from '$lib/components/HealthRing.svelte';
	import { iconMap } from '$lib/icons.js';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import { encryptData } from '$lib/crypto';
	import { cryptoStore } from '$lib/cryptoStore.svelte';
	import Footer from '$lib/components/Footer.svelte';

	/** @type {boolean} Application loading state */
	let loading = $derived(appData.loading);

	/** @type {any[]} List of active variable budgets */
	let budgets = $derived(appData.budgets);

	/** @type {any[]} List of fixed budgets */
	let fixedBudgets = $derived(appData.fixedBudgets);

	/** @type {Record<string, number>} Aggregated spending totals per category */
	let categoryTotals = $derived(appData.categoryTotals);

	/** @type {Set<string>} Set of categories containing transactions this month */
	let transactionCategories = $derived(appData.transactionCategories);

	/** @type {number} Global liquid balance calculated from all-time history */
	let globalLiquidBalance = $derived(appData.globalLiquidBalance);

	/** @type {number} Corpus used in the current period */
	let currentPeriodCorpusUsed = $derived(appData.currentPeriodCorpusUsed);

	/** @type {number} Total aggregate account balance */
	let totalAccountBalance = $derived(appData.totalAccountBalance);

	/** @type {number} Reserved monthly corpus limit */
	let corpusLimit = $derived(appData.corpusLimit);

	/** @type {number} The available operational balance (Total Balance - Corpus Limit) */
	let accountBalance = $derived(totalAccountBalance - corpusLimit);

	/** @type {number} The remaining Leftover cache */
	let personalCorpus = $derived(globalLiquidBalance + currentPeriodCorpusUsed);

	/** @type {string} Formatted user name for the greeting */
	let userName = $derived(appData.userName);

	/** @type {string} Contextual dynamic insight string */
	let insightLine = $derived(appData.insightLine);

	/**
	 * @param {number} totalData
	 * @param {number} usedData
	 */
	function getProgressColor(totalData, usedData) {
		const progress = totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0;
		if (progress > 75) return 'bg-green-500';
		if (progress > 50) return 'bg-white';
		if (progress > 25) return 'bg-yellow-400';
		return 'bg-red-500';
	}

	/**
	 * @param {number} totalData
	 * @param {number} usedData
	 */
	function getProgressWidth(totalData, usedData) {
		const progress = totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0;
		return progress + '%';
	}

	/**
	 * Calculates the optimal grid columns based on item count.
	 * @param {number} n - The total number of items
	 * @returns {3 | 4 | null} - The number of columns, or null if grid should not be applied
	 */
	function calculateGridCols(n) {
		if (n < 3) return null;
		if (n % 12 === 0) return 4;
		if (n % 3 === 0) return 3;
		if (n % 4 === 0) return 4;

		const r3 = n % 3;
		const r4 = n % 4;

		return r3 > r4 ? 3 : 4;
	}

	/**
	 * Maps the column count to explicit Tailwind grid classes to prevent purging.
	 * @param {3 | 4 | null} cols
	 * @returns {string}
	 */
	function getGridContainerClass(cols) {
		if (cols === 3) return 'grid grid-cols-3 place-items-center w-full';
		if (cols === 4) return 'grid grid-cols-4 place-items-center w-full';
		// Fallback for base case (N < 3) - retains original flex layout
		return 'flex flex-wrap justify-start';
	}

	/** @type {string} Dynamically calculated class string for Variable Expenses */
	let variableGridClass = $derived(getGridContainerClass(calculateGridCols(budgets.length)));

	/** @type {string} Dynamically calculated class string for Fixed Expenses */
	let fixedGridClass = $derived(getGridContainerClass(calculateGridCols(fixedBudgets.length)));
</script>

<div
	in:fly={{ y: 15, duration: 300, delay: 200, easing: cubicOut }}
	out:fade={{ duration: 200 }}
	class="col-start-1 row-start-1 min-w-0 w-full px-4 pt-16 relative min-h-full flex flex-col gap-6"
>
	<!-- Greeting -->
	<div class="px-2 pt-8 pb-8 mb-2">
		<h1 class="text-4xl text-white tracking-wide mb-2 font-display">Hello<br />{userName}</h1>
		<p class="text-gray-400 text-xl tracking-wide">{insightLine}</p>
	</div>

	{#if loading}
		<div class="flex justify-center mt-12 flex-1">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else}
		<!-- Variable Expenses Card -->
		<a
			href="/variable"
			class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform"
			in:fly={{ y: 20, duration: 400, delay: 0 }}
		>
			<h2 class="text-xl text-white tracking-wide mb-6 font-display">Variable Expenses</h2>

			{#if budgets.length === 0}
				<p class="text-gray-400 text-sm tracking-wide text-center py-2">
					Click here to go to variables page
				</p>
			{:else if budgets.length < 3}
				<div class="flex flex-col gap-6">
					{#each budgets as b, index}
						<div
							class="flex items-center gap-4"
							in:fly={{ y: 20, duration: 400, delay: index * 100 + 100 }}
						>
							<div
								class="shrink-0 w-12 h-12 bg-[#1a1a1a] rounded-2xl flex items-center justify-center"
							>
								{#if b.icon_name && iconMap[b.icon_name]}
									<picture class="flex items-center justify-center w-full h-full p-2.5">
										{#if iconMap[b.icon_name].avif}
											<source srcset={iconMap[b.icon_name].avif} type="image/avif" />
										{/if}
										<img
											src={iconMap[b.icon_name].webp}
											alt="{b.category} icon"
											class="w-full h-full object-contain"
										/>
									</picture>
								{:else}
									<div class="w-full h-full p-2.5 bg-[#0f0f0f] rounded-xl"></div>
								{/if}
							</div>
							<div class="flex-1 flex flex-col gap-2 min-w-0">
								<span class="text-sm text-white tracking-wide truncate">{b.category}</span>
								<div class="h-[6px] w-full bg-[#1a1a1a] rounded-full overflow-hidden">
									<div
										class="h-full rounded-full transition-all duration-1000 {getProgressColor(
											Number(b.limit_amount || 0),
											categoryTotals[b.id] || 0
										)}"
										style="width: {getProgressWidth(
											Number(b.limit_amount || 0),
											categoryTotals[b.id] || 0
										)}"
									></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="gap-x-2 gap-y-6 {variableGridClass}">
					{#each budgets as b, index}
						<div
							class="w-full min-w-0 flex justify-center"
							in:fly={{ y: 20, duration: 400, delay: index * 100 + 100 }}
						>
							<HealthRing
								category={b.category}
								totalData={Number(b.limit_amount || 0)}
								usedData={categoryTotals[b.id] || 0}
								iconName={b.icon_name}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</a>

		<!-- Fixed Expenses Card -->
		<a
			href="/fixed"
			class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform"
			in:fly={{ y: 20, duration: 400, delay: 100 }}
		>
			<h2 class="text-xl text-white tracking-wide mb-6 font-display">Fixed Expenses</h2>

			{#if fixedBudgets.length === 0}
				<p class="text-gray-400 text-sm tracking-wide text-center py-2">
					Click here to go to fixed page
				</p>
			{:else if fixedBudgets.length < 3}
				<div class="flex flex-col gap-4">
					{#each fixedBudgets as b, index}
						<div
							class="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-2xl"
							in:fly={{ y: 20, duration: 400, delay: index * 100 + 100 }}
						>
							<div class="flex items-center gap-3 min-w-0">
								<div class="shrink-0 w-8 h-8 flex items-center justify-center">
									{#if b.icon_name && iconMap[b.icon_name]}
										<picture class="w-full h-full flex items-center justify-center">
											{#if iconMap[b.icon_name].avif}
												<source srcset={iconMap[b.icon_name].avif} type="image/avif" />
											{/if}
											<img
												src={iconMap[b.icon_name].webp}
												alt="{b.category} icon"
												class="w-[80%] h-[80%] object-contain"
											/>
										</picture>
									{/if}
								</div>
								<span class="text-sm text-gray-300 tracking-wide truncate">{b.category}</span>
							</div>
							{#if transactionCategories.has(b.id)}
								<div class="shrink-0 bg-green-500 rounded-full p-1 border border-[#0f0f0f] ml-2">
									<Check class="w-3 h-3 text-black" strokeWidth={4} />
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="gap-x-2 gap-y-6 {fixedGridClass}">
					{#each fixedBudgets as b, index}
						<div
							class="flex flex-col items-center w-full max-w-[4.5rem] min-w-0"
							in:fly={{ y: 20, duration: 400, delay: index * 100 + 200 }}
						>
							<div
								class="relative w-full max-w-14 aspect-square bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-2"
							>
								{#if b.icon_name && iconMap[b.icon_name]}
									<picture class="flex items-center justify-center w-full h-full">
										{#if iconMap[b.icon_name].avif}
											<source srcset={iconMap[b.icon_name].avif} type="image/avif" />
										{/if}
										<img
											src={iconMap[b.icon_name].webp}
											alt="{b.category} icon"
											class="h-[50%] w-[50%] object-contain"
										/>
									</picture>
								{/if}

								{#if transactionCategories.has(b.id)}
									<div
										class="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-[#0f0f0f] z-10"
									>
										<Check class="w-3 h-3 text-black" strokeWidth={4} />
									</div>
								{/if}
							</div>
							<span
								class="text-xs text-gray-400 tracking-wide truncate w-full block text-center px-1"
								>{b.category}</span
							>
						</div>
					{/each}
				</div>
			{/if}
		</a>

		<!-- Balance Card -->
		<a
			href="/balance"
			class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform mt-2"
			in:fly={{ y: 20, duration: 400, delay: 200 }}
		>
			<h2 class="text-xl text-white tracking-wide mb-6 font-display">Account Balance</h2>
			<div>
				<div class="flex justify-between items-center">
					<h3 class="text-lg text-gray-400 tracking-wide">Leftover:</h3>
					<span class="text-xl text-white tracking-wide">
						₹{personalCorpus.toLocaleString('en-IN')}
					</span>
				</div>

				<div class="flex justify-between items-center">
					<h3 class="text-lg text-gray-400 tracking-wide">Total Account Balance:</h3>
					<span class="text-xl text-white tracking-wide">
						₹{totalAccountBalance.toLocaleString('en-IN')}
					</span>
				</div>
			</div>
		</a>
	{/if}

	<Footer />
</div>
