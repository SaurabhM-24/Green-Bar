<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import TransactionCard from '$lib/components/TransactionCard.svelte';
	import { ChevronDown } from 'lucide-svelte';

	let loading = $state(true);
	/** @type {any[]} */
	let transactions = $state([]);
	/** @type {any[]} */
	let categories = $state([]);

	// Read initial category from URL param if available, otherwise just "All"
	let selectedCategory = $state($page.url.searchParams.get('category') || 'All');

	$effect(() => {
		/**
		 * @param {number} m
		 * @param {number} y
		 * @param {string} [cat]
		 */
		async function loadData(m, y, cat) {
			loading = true;
			const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
			const lastDay = new Date(y, m, 0).getDate();
			const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59`;

			let query = supabase
				.from('transactions')
				.select('*')
				.gte('transaction_date', startDate)
				.lte('transaction_date', endDate)
				.order('transaction_date', { ascending: false });

			if (cat && cat !== 'All') {
				query = query.eq('category', cat);
			}

			const { data: txData } = await query;
			if (txData) transactions = txData;

			// If not fetching by specific category, extract all unique categories
			if (appState.month && appState.year) {
				const { data: budgetData } = await supabase.from('budgets').select('category');
				if (budgetData) {
					categories = ['All', ...budgetData.map((b) => b.category)];
				}
			}

			loading = false;
		}

		loadData(appState.month, appState.year, selectedCategory);
	});

	/** @param {Event & { currentTarget: HTMLSelectElement }} e */
	function handleCategoryChange(e) {
		selectedCategory = e.currentTarget.value;
	}
</script>

<div class="px-2 pt-6 pb-6">
	<!-- Filter Header -->
	<div class="mb-6 flex items-center justify-between pl-2 pr-2">
		<h1 class="text-2xl font-light tracking-wide text-white">History</h1>

		<div class="relative">
			<select
				bind:value={selectedCategory}
				onchange={handleCategoryChange}
				class="appearance-none bg-[#111111] border border-gray-800 text-gray-300 text-xs py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:border-gray-500 font-medium tracking-wide"
			>
				{#each categories as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
			<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
				<ChevronDown class="w-4 h-4 text-gray-500" />
			</div>
		</div>
	</div>

	<!-- List -->
	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else if transactions.length === 0}
		<div
			class="text-center mt-12 bg-[#0a0a0a] border border-gray-900 rounded-3xl p-8 flex flex-col items-center"
		>
			<span class="text-gray-500 font-light text-sm mb-4">No transactions found.</span>
			<button
				onclick={() => goto('/add')}
				class="px-5 py-3.5 bg-white text-black text-sm font-medium rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:bg-gray-200"
			>
				Add Transaction
			</button>
		</div>
	{:else}
		<div class="bg-[#0a0a0a] border border-gray-900 rounded-[1.5rem] overflow-hidden shadow-2xl">
			{#each transactions as tx}
				<TransactionCard
					details={tx.details}
					date={tx.transaction_date}
					amount={Number(tx.amount)}
					type={tx.transaction_type}
				/>
			{/each}
		</div>
	{/if}
</div>
