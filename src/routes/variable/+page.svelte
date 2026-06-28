<script>
	/**
	 * @fileoverview Variable Budgets page.
	 * Displays variable budgets with progress rings and supports drag-and-drop reordering.
	 */
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import { appData } from '$lib/data.svelte.js';
	import Footer from '$lib/components/Footer.svelte';
	import CategoryCard from '$lib/components/CategoryCard.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import VariableModal from '$lib/components/editCards/VariableModal.svelte';
	import AddCategoryModal from '$lib/components/editCards/AddCategoryModal.svelte';
	import { flip } from 'svelte/animate';
	import { fly, slide, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { MoreVertical } from 'lucide-svelte';

	let loading = $derived(appData.loading);
	/** @type {any[]} List of variable budgets for reordering */
	let budgets = $state([]);
	let categoryTotals = $derived(appData.categoryTotals);

	let isEditingOrder = $state(false);
	let isMenuOpen = $state(false);
	let savingOrder = $state(false);
	let isModalOpen = $state(false);
	let isAddModalOpen = $state(false);
	/** @type {any} */
	let selectedBudget = $state(null);
	const flipDurationMs = 200;

	let showDeactivateModal = $state(false);
	/** @type {string | null} */
	let pendingDeleteId = $state(null);

	/** @param {string} id */
	async function handleDelete(id) {
		const { data: txs, error: txError } = await supabase
			.from('transactions')
			.select('id')
			.eq('category_id', id)
			.limit(1);

		if (txs && txs.length > 0) {
			pendingDeleteId = id;
			isModalOpen = false;
			showDeactivateModal = true;
		} else {
			const { error } = await supabase.from('budgets').delete().eq('category_id', id);
			if (!error) {
				isModalOpen = false;
				selectedBudget = null;
				appData.loadData();
			}
		}
	}

	async function confirmDeactivate() {
		if (pendingDeleteId) {
			const { error } = await supabase
				.from('budgets')
				.update({ limit_amount: -1 })
				.eq('category_id', pendingDeleteId);
			if (!error) {
				showDeactivateModal = false;
				pendingDeleteId = null;
				appData.loadData();
			}
		}
	}

	/** @param {any} data */
	async function handleAddSave(data) {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		const user_id = session?.user?.id;

		const maxSortOrder =
			budgets.length > 0 ? Math.max(...budgets.map((b) => Number(b.sort_order || 0))) : -1;

		const { error } = await supabase.from('budgets').insert([
			{
				category_id: crypto.randomUUID(),
				category: data.category,
				description: data.description || null,
				limit_amount: data.limit_amount ? Number(data.limit_amount) : 0,
				icon_name: data.icon_name || null,
				budget_type: 'variable',
				period_type: data.period_type || 'monthly',
				reset_date: data.reset_date ? Number(data.reset_date) : 1,
				user_id: user_id,
				sort_order: maxSortOrder + 1
			}
		]);

		if (!error) {
			isAddModalOpen = false;
			appData.loadData();
		} else {
			alert('Failed to create category: ' + error.message);
		}
	}

	/** @param {any} data */
	async function handleSave(data) {
		const { error } = await supabase
			.from('budgets')
			.update({
				category: data.category,
				limit_amount: data.limit_amount,
				description: data.description,
				icon_name: data.icon_name,
				period_type: data.period_type,
				reset_date: data.reset_date
			})
			.eq('category_id', data.category_id);
		if (!error) {
			isModalOpen = false;
			selectedBudget = null;
			appData.loadData();
		}
	}

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

	/**
	 * @description Saves the new sort order to Supabase based on the user's reordering.
	 */
	async function saveOrder() {
		savingOrder = true;
		try {
			// Update each budget's sort_order based on its index
			const updates = budgets.map((b, index) => {
				return supabase
					.from('budgets')
					.update({ sort_order: index })
					.eq('category_id', b.category_id);
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

	/**
	 * @param {any} b
	 * @returns {string}
	 */
	function getResetText(b) {
		if (b.period_type === 'manual') return 'Manual Reset';
		if (!b.current_period_start) return '';

		const start = new Date(b.current_period_start);
		const now = new Date();
		let nextReset = new Date(start);

		if (b.period_type === 'daily') {
			nextReset.setDate(nextReset.getDate() + 1);
		} else if (b.period_type === 'weekly') {
			nextReset.setDate(nextReset.getDate() + 7);
		} else if (b.period_type === 'monthly') {
			nextReset.setMonth(nextReset.getMonth() + 1);
		} else if (b.period_type === 'yearly') {
			nextReset.setFullYear(nextReset.getFullYear() + 1);
		}

		const diffTime = nextReset.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Resets today';
		if (diffDays === 1) return 'Resets tomorrow';
		if (diffDays < 0) return 'Reset overdue'; // Should not happen with RPC
		return `Resets in ${diffDays} days`;
	}
</script>

<div
	in:fly={{ y: 15, duration: 300, delay: 200, easing: cubicOut }}
	out:fade={{ duration: 200 }}
	class="col-start-1 row-start-1 min-w-0 w-full px-4 pt-16 relative min-h-full flex flex-col"
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
		<h1 class="text-3xl tracking-wide text-white font-display">Variable Expenses</h1>

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
						class="absolute right-0 mt-2 w-48 bg-[#1a1a1a] rounded-xl box-3d z-50 overflow-hidden"
						transition:slide={{ duration: 250, easing: cubicOut }}
					>
						<button
							class="w-full text-left px-4 py-3 text-base tracking-wide text-gray-200 hover:bg-[#2a2a2a] transition-colors"
							onclick={startEditing}
						>
							Edit Order
						</button>
						<hr class="border-gray-800 mx-3" />
						<button
							class="w-full text-left px-4 py-3 text-base tracking-wide text-gray-200 hover:bg-[#2a2a2a] transition-colors"
							onclick={() => {
								isAddModalOpen = true;
								isMenuOpen = false;
							}}
						>
							Add Category
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
							totalData={Number(b.limit_amount || 0)}
							usedData={categoryTotals[b.category] || 0}
							iconName={b.icon_name}
							periodText={getResetText(b)}
							onclick={() => {
								if (!isEditingOrder) {
									selectedBudget = b;
									isModalOpen = true;
								}
							}}
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if isModalOpen && selectedBudget}
		<VariableModal
			budget={selectedBudget}
			amountUsed={categoryTotals[selectedBudget.category] || 0}
			amountLeft={Math.max(
				0,
				Number(selectedBudget.limit_amount || 0) - (categoryTotals[selectedBudget.category] || 0)
			)}
			onclose={() => (isModalOpen = false)}
			ondelete={handleDelete}
			onsave={handleSave}
		/>
	{/if}

	{#if showDeactivateModal}
		<div
			transition:fade={{ duration: 200 }}
			class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overflow-y-auto"
		>
			<div class="min-h-full flex items-center justify-center p-4">
				<div
					transition:scale={{ start: 0.95, duration: 250, easing: cubicOut }}
					class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative"
				>
					<h2 class="text-2xl font-display text-white tracking-wide">Cannot Delete Category</h2>
					<p class="text-gray-400 text-base leading-relaxed">
						This category is currently associated with one or more past transactions. Deleting it
						completely would break your history.
						<br /><br />
						Instead, you can <strong>deactivate</strong> this category. It will be hidden from the app
						and dropdowns, but past transactions will still be preserved.
					</p>
					<div class="flex gap-4 mt-2">
						<button
							class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:translate-y-1"
							onclick={() => {
								showDeactivateModal = false;
								pendingDeleteId = null;
							}}>Cancel</button
						>
						<button
							class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:translate-y-1"
							onclick={confirmDeactivate}>Deactivate</button
						>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if isAddModalOpen}
		<AddCategoryModal onclose={() => (isAddModalOpen = false)} onsave={handleAddSave} />
	{/if}

	<Footer />
</div>
