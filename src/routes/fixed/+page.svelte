<script>
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import CorpusCard from '$lib/components/CorpusCard.svelte';
	import FixedItem from '$lib/components/FixedItem.svelte';

	let loading = $state(true);
	/** @type {any[]} */
	let corpusBudgets = $state([]);
	/** @type {any[]} */
	let fixedBudgets = $state([]);
	let transactionCategories = $state(new Set());

	let globalLiquidBalance = $state(0);
	let currentMonthCorpusUsed = $state(0);

	$effect(() => {
		/**
		 * @param {number} m
		 * @param {number} y
		 */
		async function loadData(m, y) {
			loading = true;
			const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
			const lastDay = new Date(y, m, 0).getDate();
			const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59`;

			// Previous month bounds for Salary
			const pmList = new Date(y, m - 2, 1);
			const prevM = pmList.getMonth() + 1;
			const prevY = pmList.getFullYear();
			const prevMonthStart = `${prevY}-${String(prevM).padStart(2, '0')}-01`;

			// 1. Fetch Budgets
			const { data: budgetData } = await supabase.from('budgets').select('*');

			let totalMonthlyLimits = 0;
			if (budgetData) {
				corpusBudgets = budgetData.filter((b) => b.budget_type === 'corpus');
				fixedBudgets = budgetData.filter((b) => b.budget_type === 'fixed');
				budgetData.forEach((b) => {
					totalMonthlyLimits += Number(b.monthly_limit || 0);
				});
			}

			// 2. Fetch Transactions for the checklist
			// We fetch from previousMonthStart to cover 'Salary'
			const { data: txData } = await supabase
				.from('transactions')
				.select('category, transaction_date')
				.gte('transaction_date', prevMonthStart)
				.lte('transaction_date', endDate);

			const cats = new Set();
			if (txData) {
				txData.forEach((tx) => {
					if (tx.category) {
						if (tx.category === 'Salary') {
							if (tx.transaction_date >= prevMonthStart && tx.transaction_date < startDate) {
								cats.add(tx.category);
							}
						} else {
							if (tx.transaction_date >= startDate) {
								cats.add(tx.category);
							}
						}
					}
				});
			}
			transactionCategories = cats;

			// 3. Global All Time Sum query for Personal Corpus
			const { data: allHistory } = await supabase
				.from('transactions')
				.select('amount, transaction_type, transaction_date, category');

			let liquidTillLastMonth = 0;
			let monthCorpusSum = 0;
			if (allHistory) {
				allHistory.forEach((tx) => {
					const val = Math.abs(Number(tx.amount));

					if (tx.transaction_date < startDate) {
						if (tx.transaction_type.toLowerCase() === 'credit') liquidTillLastMonth += val;
						else liquidTillLastMonth -= val;
					}

					if (
						tx.transaction_date >= startDate &&
						tx.transaction_date <= endDate &&
						tx.category &&
						tx.category.toLowerCase() === 'personal corpus'
					) {
						if (tx.transaction_type.toLowerCase() === 'credit') monthCorpusSum += val;
						else monthCorpusSum -= val;
					}
				});
			}
			globalLiquidBalance = liquidTillLastMonth - totalMonthlyLimits;
			// Pass raw negative state downstream. UI will invert it to represent 'used' spent tally.
			currentMonthCorpusUsed = monthCorpusSum;

			loading = false;
		}

		loadData(appState.month, appState.year);
	});
</script>

<div class="px-2 pt-2 pb-6">
	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else}
		{#if corpusBudgets.length > 0}
			<h1 class="text-2xl font-light tracking-wide text-white mb-6 pl-2">Corpus Funds</h1>
			<div class="mb-8">
				{#each corpusBudgets as b}
					<CorpusCard
						title={b.category}
						lockedData={Number(b.monthly_limit || 0)}
						leftData={globalLiquidBalance + currentMonthCorpusUsed}
						usedData={-currentMonthCorpusUsed}
					/>
				{/each}
			</div>
		{/if}

		<h1 class="text-2xl font-light tracking-wide text-white mb-4 pl-2 mt-4">
			Fixed Responsibilities
		</h1>
		<div class="bg-[#0f0f0f] border border-gray-900 rounded-3xl p-4 shadow-2xl">
			{#if fixedBudgets.length === 0}
				<div class="text-center py-4 text-gray-500 font-light text-sm">No fixed budgets found.</div>
			{/if}
			{#each fixedBudgets as b}
				<FixedItem title={b.category} isChecked={transactionCategories.has(b.category)} />
			{/each}
		</div>
	{/if}
</div>
