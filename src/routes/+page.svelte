<script>
	/**
	 * @fileoverview Main Dashboard page.
	 * Displays high-level insights, variable expenses overview, fixed responsibilities, and overall balance.
	 */
	import { appData } from '$lib/data.svelte.js';
	import { Check } from 'lucide-svelte';
	import HealthRing from '$lib/components/HealthRing.svelte';

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
	
	/** @type {number} Corpus used in the current month */
	let currentMonthCorpusUsed = $derived(appData.currentMonthCorpusUsed);
	
	/** @type {number} Total aggregate account balance */
	let totalAccountBalance = $derived(appData.totalAccountBalance);
	
	/** @type {number} Reserved monthly corpus limit */
	let corpusLimit = $derived(appData.corpusLimit);

	/** @type {number} The available operational balance (Total Balance - Corpus Limit) */
	let accountBalance = $derived(totalAccountBalance - corpusLimit);
	
	/** @type {number} The remaining personal corpus cache */
	let personalCorpus = $derived(globalLiquidBalance + currentMonthCorpusUsed);

	/** @type {string} Formatted user name for the greeting */
	let userName = $derived(appData.userName);
	
	/** @type {string} Contextual dynamic insight string */
	let insightLine = $derived(appData.insightLine);
</script>

<div class="px-4 pt-16 pb-16 min-h-full flex flex-col gap-6">
	<!-- Greeting -->
	<div class="px-2 pt-8 pb-8 mb-2">
		<h1 class="text-4xl text-white tracking-wide mb-2 font-display">Hello<br />{userName}</h1>
		<p class="text-gray-400 text-lg tracking-wide">{insightLine}</p>
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
		>
			<h2 class="text-xl text-white tracking-wide mb-6 font-display">Variable Expenses</h2>
			<div class="flex flex-wrap gap-x-2 gap-y-6 justify-start">
				{#each budgets as b}
					<HealthRing
						category={b.category}
						totalData={Number(b.monthly_limit || 0)}
						usedData={categoryTotals[b.category] || 0}
						iconName={b.icon_name}
					/>
				{/each}
			</div>
		</a>

		<!-- Fixed Expenses Card -->
		<a
			href="/fixed"
			class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform"
		>
			<h2 class="text-xl text-white tracking-wide mb-6 font-display">Fixed Expenses</h2>
			<div class="flex flex-wrap gap-x-2 gap-y-6 justify-start">
				{#each fixedBudgets as b}
					<div class="flex flex-col items-center w-[4.5rem]">
						<div
							class="relative w-14 h-14 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-2"
						>
							{#if b.icon_name}
								<picture>
									<source srcset="/icons/{b.icon_name}.avif" type="image/avif" />
									<img
										src="/icons/{b.icon_name}.webp"
										alt="{b.category} icon"
										class="h-7 w-7 object-contain"
									/>
								</picture>
							{/if}

							{#if transactionCategories.has(b.category)}
								<div
									class="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-[#0f0f0f] z-10"
								>
									<Check class="w-3 h-3 text-black" strokeWidth={4} />
								</div>
							{/if}
						</div>
						<span class="text-xs text-gray-400 tracking-wide truncate max-w-full text-center"
							>{b.category}</span
						>
					</div>
				{/each}
			</div>
		</a>

		<!-- Balance Card -->
		<a
			href="/fixed"
			class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform mt-2"
		>
			<div class="flex justify-between items-center mb-3">
				<h2 class="text-lg text-gray-400 tracking-wide">Account Balance:</h2>
				<span class="text-xl text-white tracking-wide">
					₹{accountBalance.toLocaleString('en-IN')}
				</span>
			</div>
			<div class="flex justify-between items-center">
				<h2 class="text-lg text-gray-400 tracking-wide">Personal Corpus:</h2>
				<span class="text-xl text-white tracking-wide">
					₹{personalCorpus.toLocaleString('en-IN')}
				</span>
			</div>
		</a>
	{/if}
</div>
