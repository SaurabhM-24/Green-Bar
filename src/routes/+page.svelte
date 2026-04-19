<script>
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import CategoryCard from '$lib/components/CategoryCard.svelte';

	let loading = $state(true);
	let budgets = $state([]);
	let categoryTotals = $state({});

	$effect(() => {
		async function loadData(m, y) {
			loading = true;
			const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
			const lastDay = new Date(y, m, 0).getDate();
			const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59`;

			// 1. Fetch Budgets
			const { data: budgetData } = await supabase
				.from('budgets')
				.select('*')
				.eq('budget_type', 'variable');

			if (budgetData) budgets = budgetData;

			// 2. Fetch Transactions for the month
			const { data: txData } = await supabase
				.from('transactions')
				.select('category, amount, transaction_type')
				.gte('transaction_date', startDate)
				.lte('transaction_date', endDate)
				.eq('transaction_type', 'debit');

			// Calculate sums
			const totals = {};
			if (txData) {
				txData.forEach((tx) => {
					if (tx.category) {
						totals[tx.category] = (totals[tx.category] || 0) + Math.abs(Number(tx.amount));
					}
				});
			}
			categoryTotals = totals;
			loading = false;
		}

		loadData(appState.month, appState.year);
	});
</script>

<div class="px-2 pt-2 pb-6">
	<h1 class="text-2xl font-light tracking-wide text-white mb-6 pl-2">Variable Expenses</h1>

	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else if budgets.length === 0}
		<div class="text-center mt-12 text-gray-500 font-light text-sm">No variable budgets found.</div>
	{:else}
		<div class="space-y-4">
			{#each budgets as b}
				<CategoryCard
					title={b.category}
					totalData={Number(b.monthly_limit || 0)}
					usedData={categoryTotals[b.category] || 0}
				/>
			{/each}
		</div>
	{/if}
</div>
