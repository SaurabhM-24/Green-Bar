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

	let groupedTransactions = $derived.by(() => {
		/** @type {{ date: string, items: any[] }[]} */
		let groups = [];
		let currentGroup = null;
		for (const tx of transactions) {
			if (!currentGroup || currentGroup.date !== tx.transaction_date) {
				currentGroup = { date: tx.transaction_date, items: [] };
				groups.push(currentGroup);
			}
			currentGroup.items.push(tx);
		}
		return groups;
	});

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
				.order('transaction_date', { ascending: false })
				.order('created_at', { ascending: false });

			if (cat && cat !== 'All') {
				query = query.eq('category', cat);
			}

			const { data: txData } = await query;
			if (txData) transactions = txData;

			// If not fetching by specific category, extract all unique categories
			if (appState.month && appState.year) {
				const { data: budgetData } = await supabase.from('budgets').select('category, icon_name, budget_type, sort_order');
				if (budgetData) {
					/** @type {Record<string, number>} */
					const typeOrder = { variable: 1, corpus: 2, fixed: 3 };
					budgetData.sort((a, b) => {
						const orderA = typeOrder[a.budget_type] || 99;
						const orderB = typeOrder[b.budget_type] || 99;
						if (orderA !== orderB) return orderA - orderB;
						return (a.sort_order || 0) - (b.sort_order || 0);
					});
					categories = [{ category: 'All' }, ...budgetData];
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

	let isCategoryDropdownOpen = $state(false);
	function toggleCategoryDropdown() {
		isCategoryDropdownOpen = !isCategoryDropdownOpen;
	}
	/** @param {string} cat */
	function selectCategory(cat) {
		selectedCategory = cat;
		isCategoryDropdownOpen = false;
	}

	let selectedCategoryIcon = $derived(
		categories.find((c) => c.category === selectedCategory)?.icon_name
	);
</script>

<div class="px-4 pt-16 pb-16">
	<!-- Filter Header -->
	<div class="mb-8 flex items-center justify-between px-4">
		<h1 class="text-3xl tracking-wide text-white font-display">History</h1>

		<div class="relative z-40">
			<button
				class="bg-[#111111] text-gray-300 text-sm tracking-wide py-3 pl-4 pr-4 rounded-xl focus:outline-none box-3d flex items-center gap-3"
				onclick={toggleCategoryDropdown}
			>
				<div class="flex items-center gap-2">
					{#if selectedCategoryIcon}
						<picture>
							<source srcset="/icons/{selectedCategoryIcon}.avif" type="image/avif" />
							<img src="/icons/{selectedCategoryIcon}.webp" alt="" class="h-4 w-4 object-contain" />
						</picture>
					{/if}
					{selectedCategory}
				</div>
				<ChevronDown class="w-4 h-4 text-gray-500" />
			</button>
			
			{#if isCategoryDropdownOpen}
				<div class="fixed inset-0 z-30" onclick={() => isCategoryDropdownOpen = false} role="presentation"></div>
				
				<div class="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-[#1a1a1a] rounded-xl box-3d z-40 p-2 flex flex-col gap-1">
					{#each categories as cat}
						<button 
							class="flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {selectedCategory === cat.category ? 'bg-white text-black box-3d' : 'text-gray-200 hover:bg-[#2a2a2a]'}"
							onclick={() => selectCategory(cat.category)}
						>
							{#if cat.icon_name}
								<picture>
									<source srcset="/icons/{cat.icon_name}.avif" type="image/avif" />
									<img src="/icons/{cat.icon_name}.webp" alt="" class="h-5 w-5 object-contain" />
								</picture>
							{/if}
							<span>{cat.category}</span>
						</button>
					{/each}
				</div>
			{/if}
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
		<div class="text-center mt-12 bg-[#0a0a0a] rounded-3xl p-8 flex flex-col items-center box-3d">
			<span class="text-gray-500 tracking-wide text-base mb-4">No transactions found.</span>
			<button
				onclick={() => goto('/add')}
				class="px-5 py-3.5 bg-white text-black text-sm tracking-wide rounded-xl box-3d hover:bg-gray-200"
			>
				Add Transaction
			</button>
		</div>
	{:else}
		{#each groupedTransactions as group}
			<div class="mb-8">
				<h2 class="text-xl text-gray-400 tracking-wide px-2 mb-4 font-display">{group.date}</h2>
				<div class="bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden box-3d">
					{#each group.items as tx}
						<TransactionCard
							title={tx.title}
							description={tx.description}
							amount={Number(tx.amount)}
							type={tx.transaction_type}
							iconName={categories.find(c => c.category === tx.category)?.icon_name}
						/>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>
