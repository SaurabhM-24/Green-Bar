<script>
	/**
	 * @fileoverview Fixed Responsibilities & Corpus Funds page.
	 * Displays fixed and corpus budgets, and supports drag-and-drop reordering.
	 */
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import { appData } from '$lib/data.svelte.js';
	import CorpusCard from '$lib/components/CorpusCard.svelte';
	import FixedItem from '$lib/components/FixedItem.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { MoreVertical } from 'lucide-svelte';

	let loading = $derived(appData.loading);
	let corpusBudgets = $derived(appData.corpusBudgets);
	
	/** @type {any[]} List of fixed budgets for reordering */
	let fixedBudgets = $state([]);
	let transactionCategories = $derived(appData.transactionCategories);

	let globalLiquidBalance = $derived(appData.globalLiquidBalance);
	let currentMonthCorpusUsed = $derived(appData.currentMonthCorpusUsed);

	let isEditingOrder = $state(false);
	let isMenuOpen = $state(false);
	let savingOrder = $state(false);
	const flipDurationMs = 200;

	$effect(() => {
		if (!appData.loading) {
			fixedBudgets = [...appData.fixedBudgets];
		}
	});

	/** @param {CustomEvent<any>} e */
	function handleDndConsider(e) {
		fixedBudgets = e.detail.items;
	}

	/** @param {CustomEvent<any>} e */
	function handleDndFinalize(e) {
		fixedBudgets = e.detail.items;
	}

	/**
	 * @description Saves the new sort order to Supabase based on the user's reordering.
	 */
	async function saveOrder() {
		savingOrder = true;
		try {
			const updates = fixedBudgets.map((b, index) => {
				return supabase.from('budgets').update({ sort_order: index }).eq('category_id', b.category_id);
			});
			await Promise.all(updates);
		} catch (error) {
			console.error('Failed to save order:', error);
		}
		savingOrder = false;
		isEditingOrder = false;
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function startEditing() {
		isEditingOrder = true;
		isMenuOpen = false;
	}

	function cancelEditing() {
		isEditingOrder = false;
	}
</script>

<div
	class="px-4 pt-16 pb-16"
	role="presentation"
	onclick={() => {
		if (isMenuOpen) isMenuOpen = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape' && isMenuOpen) isMenuOpen = false;
	}}
>
	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else}
		{#if corpusBudgets.length > 0}
			<h1 class="text-3xl tracking-wide text-white mb-8 px-4">Corpus Funds</h1>
			<div class="mb-8">
				{#each corpusBudgets as b}
					<CorpusCard
						title={b.category}
						lockedData={Number(b.monthly_limit || 0)}
						leftData={globalLiquidBalance + currentMonthCorpusUsed}
						usedData={-currentMonthCorpusUsed}
						iconName={b.icon_name}
					/>
				{/each}
			</div>
		{/if}

		<div class="flex items-center justify-between mb-6 px-4 mt-8">
			<h1 class="text-3xl tracking-wide text-white">Fixed Responsibilities</h1>

			{#if !isEditingOrder}
				<div class="relative">
					<button
						class="p-2 text-gray-400 hover:text-white"
						onclick={(e) => {
							e.stopPropagation();
							toggleMenu();
						}}
					>
						<MoreVertical class="w-5 h-5" />
					</button>
					{#if isMenuOpen}
						<div
							class="absolute right-0 mt-2 w-40 bg-[#1a1a1a] rounded-xl box-3d z-50 overflow-hidden"
						>
							<button
								class="w-full text-left px-4 py-3 text-base tracking-wide text-gray-200 hover:bg-[#2a2a2a] transition-colors"
								onclick={startEditing}
							>
								Edit Order
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex items-center space-x-2">
					<button
						class="text-sm text-gray-400 tracking-wide px-3 py-1.5 rounded-lg border border-gray-800 hover:bg-[#1a1a1a]"
						onclick={cancelEditing}
						disabled={savingOrder}
					>
						Cancel
					</button>
					<button
						class="text-sm text-black tracking-wide px-4 py-1.5 rounded-lg bg-white box-3d hover:bg-gray-200 disabled:opacity-50"
						onclick={saveOrder}
						disabled={savingOrder}
					>
						{savingOrder ? 'Saving...' : 'Done'}
					</button>
				</div>
			{/if}
		</div>

		<div class="bg-[#0f0f0f] rounded-3xl p-6 box-3d">
			{#if fixedBudgets.length === 0}
				<div class="text-center py-4 text-gray-500 tracking-wide text-base">
					No fixed budgets found.
				</div>
			{/if}
			<div
				use:dndzone={{
					items: fixedBudgets,
					dragDisabled: !isEditingOrder,
					dropTargetStyle: {},
					dropTargetClasses: ['outline-none']
				}}
				onconsider={handleDndConsider}
				onfinalize={handleDndFinalize}
			>
				{#each fixedBudgets as b, index (b.id)}
					<div
						animate:flip={{ duration: flipDurationMs }}
						class={isEditingOrder
							? 'cursor-grab active:cursor-grabbing opacity-80 scale-[0.98] transition-transform'
							: 'transition-transform duration-300'}
					>
						<div class={isEditingOrder ? 'pointer-events-none' : ''}>
							<FixedItem
								title={b.category}
								isChecked={transactionCategories.has(b.category)}
								isLast={index === fixedBudgets.length - 1}
								iconName={b.icon_name}
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
