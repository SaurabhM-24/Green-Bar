<script>
	/**
	 * @fileoverview Balance page.
	 * Displays corpus budgets, and an overall bank balance bar chart.
	 */
	import { supabase } from '$lib/supabase';
	import { appData } from '$lib/data.svelte.js';
	import Footer from '$lib/components/Footer.svelte';
	import CorpusCard from '$lib/components/CorpusCard.svelte';
	import CorpusModal from '$lib/components/editCards/CorpusModal.svelte';
	import { encryptData } from '$lib/crypto';
	import { cryptoStore } from '$lib/cryptoStore.svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { iconMap } from '$lib/icons.js';

	let loading = $derived(appData.loading);
	let corpusBudgets = $derived(appData.corpusBudgets);
	let variableBudgets = $derived(appData.budgets);
	let fixedBudgets = $derived(appData.fixedBudgets);
	let categoryTotals = $derived(appData.categoryTotals);
	let totalAccountBalance = $derived(appData.totalAccountBalance);
	let globalLiquidBalance = $derived(appData.globalLiquidBalance);
	let currentPeriodCorpusUsed = $derived(appData.currentPeriodCorpusUsed);

	let isCorpusModalOpen = $state(false);
	/** @type {any} */
	let selectedCorpusBudget = $state(null);

	let showDeactivateModal = $state(false);
	/** @type {string | null} */
	let pendingDeleteId = $state(null);

	const colors = [
		'bg-green-500',
		'bg-blue-500',
		'bg-yellow-400',
		'bg-purple-500',
		'bg-pink-500',
		'bg-indigo-500',
		'bg-teal-400',
		'bg-orange-500'
	];

	let barSections = $derived.by(() => {
		/** @type {any[]} */
		let sections = [];
		let colorIndex = 0;
		let totalAllocated = 0;

		// Variable Budgets
		variableBudgets.forEach((b) => {
			const left = Math.max(0, Number(b.limit_amount || 0) - (categoryTotals[b.id] || 0));
			if (left > 0) {
				sections.push({
					id: b.id,
					name: b.category,
					amount: left,
					color: colors[colorIndex % colors.length],
					icon_name: b.icon_name
				});
				colorIndex++;
				totalAllocated += left;
			}
		});

		// Fixed Budgets
		fixedBudgets.forEach((b) => {
			const left = Math.max(0, Number(b.limit_amount || 0) - (categoryTotals[b.id] || 0));
			if (left > 0) {
				sections.push({
					id: b.id,
					name: b.category,
					amount: left,
					color: colors[colorIndex % colors.length],
					icon_name: b.icon_name
				});
				colorIndex++;
				totalAllocated += left;
			}
		});

		// Corpus Budgets logic
		let corpusAmount = 0;
		if (corpusBudgets.length > 0) {
			corpusAmount = Number(corpusBudgets[0].limit_amount || 0);
			if (corpusAmount > 0) {
				totalAllocated += corpusAmount;
			}
		}

		// Unallocated Balance (Leftovers)
		const unallocated = totalAccountBalance - totalAllocated;
		if (unallocated > 0) {
			let lastColor = colors[colorIndex % colors.length];
			if (sections.length > 0 && lastColor === sections[0].color) {
				colorIndex++;
				lastColor = colors[colorIndex % colors.length];
			}
			sections.push({
				id: 'unallocated',
				name: 'Leftovers',
				amount: unallocated,
				color: lastColor,
				icon_name: 'wallet'
			});
		}

		// Locked Funds (Singular Corpus Category at the bottom)
		if (corpusAmount > 0) {
			sections.push({
				id: corpusBudgets[0].id,
				name: 'Locked',
				amount: corpusAmount,
				color: 'bg-white opacity-40',
				icon_name: null
			});
		}

		return sections;
	});

	/** @param {string} id */
	async function handleDelete(id) {
		const hasTxs = appData.allTransactions.some((tx) => tx.category_id === id);

		if (hasTxs) {
			pendingDeleteId = id;
			isCorpusModalOpen = false;
			showDeactivateModal = true;
		} else {
			const { error } = await supabase.from('budgets_encrypted').delete().eq('category_id', id);
			if (!error) {
				isCorpusModalOpen = false;
				selectedCorpusBudget = null;
				appData.loadData();
			}
		}
	}

	async function confirmDeactivate() {
		if (pendingDeleteId && cryptoStore.dmk) {
			const b =
				appData.budgets.find((bd) => bd.category_id === pendingDeleteId) ||
				appData.corpusBudgets.find((bd) => bd.category_id === pendingDeleteId) ||
				appData.fixedBudgets.find((bd) => bd.category_id === pendingDeleteId);
			if (b) {
				const payload = { ...b, limit_amount: -1 };
				delete payload.id;
				delete payload.category_id;
				delete payload.current_period_start;

				const encryptedData = await encryptData(payload, cryptoStore.dmk);
				const { error } = await supabase
					.from('budgets_encrypted')
					.update({ encrypted_data: encryptedData })
					.eq('category_id', pendingDeleteId);

				if (!error) {
					showDeactivateModal = false;
					pendingDeleteId = null;
					appData.loadData();
				}
			}
		}
	}

	/** @param {any} data */
	async function handleSave(data) {
		if (!cryptoStore.dmk) return;
		const b = appData.corpusBudgets.find((bd) => bd.category_id === data.category_id);
		if (!b) return;

		const payload = {
			...b,
			category: data.category,
			limit_amount: data.limit_amount,
			description: data.description,
			icon_name: data.icon_name,
			period_type: data.period_type,
			reset_date: data.reset_date
		};
		delete payload.id;
		delete payload.category_id;
		delete payload.current_period_start;

		const encryptedData = await encryptData(payload, cryptoStore.dmk);

		const { error } = await supabase
			.from('budgets_encrypted')
			.update({ encrypted_data: encryptedData })
			.eq('category_id', data.category_id);

		if (!error) {
			selectedCorpusBudget = null;
			isCorpusModalOpen = false;
			appData.loadData();
		}
	}

	/** @param {any} b */
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
		if (diffDays < 0) return 'Reset overdue';
		return `Resets in ${diffDays} days`;
	}
</script>

<div
	in:fly={{ y: 15, duration: 300, delay: 200, easing: cubicOut }}
	out:fade={{ duration: 200 }}
	class="col-start-1 row-start-1 min-w-0 w-full px-4 pt-16 relative min-h-full flex flex-col"
	role="presentation"
>
	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else}
		<h1 class="text-3xl tracking-wide text-white mb-8 px-4 font-display">Account Balance</h1>

		<div id="corpus-list" class="mb-8">
			{#if corpusBudgets.length === 0}
				<div class="text-center py-4 text-gray-500 tracking-wide text-base">
					No locked funds found.
				</div>
			{:else}
				<div in:fly={{ y: 20, duration: 400, delay: 0 }}>
					<CorpusCard
						title={corpusBudgets[0].category}
						lockedData={Number(corpusBudgets[0].limit_amount || 0)}
						leftData={globalLiquidBalance + currentPeriodCorpusUsed}
						usedData={-currentPeriodCorpusUsed}
						iconName={corpusBudgets[0].icon_name}
						periodText={getResetText(corpusBudgets[0])}
						onclick={() => {
							selectedCorpusBudget = corpusBudgets[0];
							isCorpusModalOpen = true;
						}}
					/>
				</div>
			{/if}
		</div>

		<div
			class="bg-[#0f0f0f] rounded-[2.5rem] p-8 mb-8 box-3d flex flex-col gap-6"
			in:fly={{ y: 20, duration: 400, delay: 200 }}
		>
			<div class="flex justify-between items-end">
				<h2 class="text-2xl text-white tracking-wide font-display">Bank Balance</h2>
				<span class="text-xl text-white tracking-wide font-medium"
					>₹{totalAccountBalance.toLocaleString('en-IN')}</span
				>
			</div>

			<div class="flex gap-6 mt-2 min-h-[480px]">
				<!-- Bar Container -->
				<div
					class="w-10 bg-[#1a1a1a] rounded-2xl flex flex-col overflow-hidden box-3d shrink-0 h-full"
				>
					{#each barSections as sec}
						<div
							class="w-full {sec.color} transition-all duration-700 ease-out"
							style="flex: {sec.amount} 0 42px;"
						></div>
					{/each}
				</div>

				<!-- Labels Container -->
				<div class="flex-1 flex flex-col h-full justify-start overflow-hidden relative">
					{#each barSections as sec}
						<div
							class="w-full flex flex-col justify-center px-1"
							style="flex: {sec.amount} 0 42px;"
						>
							<div class="flex items-center justify-between w-full relative z-10">
								<div class="flex items-center gap-2.5 min-w-0 flex-1">
									<!-- Icon -->
									{#if sec.icon_name && iconMap[sec.icon_name]}
										<picture class="w-5 h-5 shrink-0 flex items-center justify-center">
											{#if iconMap[sec.icon_name].avif}
												<source srcset={iconMap[sec.icon_name].avif} type="image/avif" />
											{/if}
											<img
												src={iconMap[sec.icon_name].webp}
												alt=""
												class="w-full h-full object-contain"
											/>
										</picture>
									{:else}
										<div class="w-2.5 h-2.5 rounded-full {sec.color} shrink-0 mx-1"></div>
									{/if}
									<span class="text-base text-gray-200 tracking-wide truncate">{sec.name}</span>
								</div>
								<span class="text-sm text-gray-400 tracking-wider shrink-0 ml-3"
									>₹{sec.amount.toLocaleString('en-IN')}</span
								>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if isCorpusModalOpen && selectedCorpusBudget}
		<CorpusModal
			budget={selectedCorpusBudget}
			amountUsed={-currentPeriodCorpusUsed}
			amountLeft={globalLiquidBalance + currentPeriodCorpusUsed}
			onclose={() => (isCorpusModalOpen = false)}
			ondelete={handleDelete}
			onsave={handleSave}
		/>
	{/if}

	{#if showDeactivateModal}
		<div
			class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
		>
			<div class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6">
				<h2 class="text-2xl font-display text-white tracking-wide">Cannot Delete Category</h2>
				<p class="text-gray-400 text-base leading-relaxed">
					This category is currently associated with one or more past transactions. Deleting it
					completely would break your history.
					<br /><br />
					Instead, you can <strong>deactivate</strong> this category. It will be hidden from the app and
					dropdowns, but past transactions will still be preserved.
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
	{/if}

	<Footer />
</div>
