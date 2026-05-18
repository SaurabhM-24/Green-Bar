<script>
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import { appData } from '$lib/data.svelte.js';
	import CategoryCard from '$lib/components/CategoryCard.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { MoreVertical } from 'lucide-svelte';

	let loading = $derived(appData.loading);
	/** @type {any[]} */
	let budgets = $state([]);
	let categoryTotals = $derived(appData.categoryTotals);

	let isEditingOrder = $state(false);
	let isMenuOpen = $state(false);
	let savingOrder = $state(false);
	const flipDurationMs = 200;

	$effect(() => {
		if (!appData.loading) {
			budgets = [...appData.budgets];
		}
	});

	/** @param {CustomEvent<any>} e */
	function handleDndConsider(e) {
		budgets = e.detail.items;
	}

	/** @param {CustomEvent<any>} e */
	function handleDndFinalize(e) {
		budgets = e.detail.items;
	}

	async function saveOrder() {
		savingOrder = true;
		try {
			// Update each budget's sort_order based on its index
			const updates = budgets.map((b, index) => {
				return supabase.from('budgets').update({ sort_order: index }).eq('category', b.category);
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
		// Just turn off editing mode; we could also reload original order if we wanted to be strict
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
	<!-- Header area -->
	<div class="flex items-center justify-between mb-8 px-4">
		<h1 class="text-3xl tracking-wide text-white">Variable Expenses</h1>

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

	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else if budgets.length === 0}
		<div class="text-center mt-12 text-gray-500 tracking-wide text-base">
			No variable budgets found.
		</div>
	{:else}
		<div
			class="space-y-6"
			use:dndzone={{
				items: budgets,
				dragDisabled: !isEditingOrder,
				dropTargetStyle: {},
				dropTargetClasses: ['outline-none']
			}}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
		>
			{#each budgets as b (b.id)}
				<div
					animate:flip={{ duration: flipDurationMs }}
					class={isEditingOrder
						? 'cursor-grab active:cursor-grabbing opacity-80 scale-[0.98] transition-transform'
						: 'transition-transform duration-300'}
				>
					<div class={isEditingOrder ? 'pointer-events-none' : ''}>
						<CategoryCard
							title={b.category}
							totalData={Number(b.monthly_limit || 0)}
							usedData={categoryTotals[b.category] || 0}
							iconName={b.icon_name}
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
