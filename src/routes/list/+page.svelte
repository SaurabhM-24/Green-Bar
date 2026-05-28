<script>
	/**
	 * @fileoverview Transaction list and history view.
	 * Displays all transactions for a given month, grouped by date, and allows filtering by category.
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import { appData } from '$lib/data.svelte.js';
	import TransactionCard from '$lib/components/TransactionCard.svelte';
	import TransactionDetailsModal from '$lib/components/editCards/TransactionDetailsModal.svelte';
	import { ChevronDown } from 'lucide-svelte';
	import { iconMap } from '$lib/icons.js';

	/** @type {boolean} Local loading state for transactions */
	let loading = $state(true);
	
	/** @type {any[]} List of transactions for the selected month and filter */
	let transactions = $state([]);
	
	let selectedTransaction = $state(null);
	let isModalOpen = $state(false);
	
	/** @type {any[]} Filter options for dropdown derived from global app data */
	let categories = $state([]);

	/** @type {string} Currently selected category for filtering */
	let selectedCategory = $state($page.url.searchParams.get('category') || 'All');

	/**
	 * @description Derived array grouping transactions by their transaction_date.
	 */
	let groupedTransactions = $derived.by(() => {
		/** @type {{ date: string, items: any[] }[]} */
		let groups = [];
		/** @type {{ date: string, items: any[] } | null} */
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

	/**
	 * @description Effect: Derives category dropdown list globally from appData to avoid redundant Supabase queries.
	 */
	$effect(() => {
		if (!appData.loading) {
			categories = [
				{ category: 'All' },
				...appData.budgets,
				...appData.corpusBudgets,
				...appData.fixedBudgets
			];
		}
	});

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

		loading = false;
	}

	/**
	 * @description Effect: Fetches transaction list whenever month, year, or filter category changes.
	 */
	$effect(() => {
		loadData(appState.month, appState.year, selectedCategory);
	});

	/** @param {any} id */
	async function handleDelete(id) {
		const { error } = await supabase.from('transactions').delete().eq('id', id);
		if (!error) {
			isModalOpen = false;
			selectedTransaction = null;
			loadData(appState.month, appState.year, selectedCategory);
			appData.loadData(appState.month, appState.year);
		}
	}

	/** @param {any} data */
	async function handleSave(data) {
		const updatePayload = {
			title: data.title,
			description: data.description,
			amount: data.amount,
			transaction_date: data.transaction_date,
			category: data.category,
			transaction_type: data.transaction_type
		};
		const { error } = await supabase.from('transactions').update(updatePayload).eq('id', data.id);
		if (!error) {
			isModalOpen = false;
			selectedTransaction = null;
			loadData(appState.month, appState.year, selectedCategory);
			appData.loadData(appState.month, appState.year);
		}
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
					{#if selectedCategoryIcon && iconMap[selectedCategoryIcon]}
						<picture>
							{#if iconMap[selectedCategoryIcon].avif}
								<source srcset={iconMap[selectedCategoryIcon].avif} type="image/avif" />
							{/if}
							<img src={iconMap[selectedCategoryIcon].webp} alt="" class="h-4 w-4 object-contain" />
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
							{#if cat.icon_name && iconMap[cat.icon_name]}
								<picture>
									{#if iconMap[cat.icon_name].avif}
										<source srcset={iconMap[cat.icon_name].avif} type="image/avif" />
									{/if}
									<img src={iconMap[cat.icon_name].webp} alt="" class="h-5 w-5 object-contain" />
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
							onclick={() => {
								selectedTransaction = tx;
								isModalOpen = true;
							}}
						/>
					{/each}
				</div>
			</div>
		{/each}
	{/if}

	<!-- Transaction Details Modal -->
	{#if isModalOpen && selectedTransaction}
		<TransactionDetailsModal
			transaction={selectedTransaction}
			categories={categories}
			onclose={() => isModalOpen = false}
			ondelete={handleDelete}
			onsave={handleSave}
		/>
	{/if}
</div>
