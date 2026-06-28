<script>
	import { X, ChevronDown } from 'lucide-svelte';
	import { iconsList, iconMap } from '$lib/icons.js';
	import { slide, fade, scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { onclose, onsave } = $props();

	let isIconDropdownOpen = $state(false);
	let addData = $state({
		category: '',
		description: '',
		limit_amount: '',
		icon_name: '',
		period_type: 'monthly',
		reset_date: 1
	});
	let loading = $state(false);

	function handleSave() {
		if (!addData.category) {
			alert('Category name is required.');
			return;
		}
		loading = true;
		onsave({ ...addData });
	}
</script>

<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overflow-y-auto"
	onclick={() => {
		if (!loading) onclose();
	}}
	role="presentation"
>
	<div class="min-h-full flex items-center justify-center p-4">
		<!-- Modal Content -->
		<div
			transition:scale={{ start: 0.95, duration: 250, easing: cubicOut }}
			class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- Top Bar -->
			<div class="flex justify-between items-start gap-4">
				<div class="flex flex-col gap-1 w-full">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold pl-1"
						>Category Name</span
					>
					<textarea
						rows="2"
						style="field-sizing: content; min-width: 2ch;"
						bind:value={addData.category}
						class="bg-transparent font-display text-3xl text-white tracking-wide pr-14 leading-tight focus:outline-none placeholder-gray-600 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1 resize-none"
						placeholder="Category Name"
					></textarea>
				</div>
				<button
					class="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors bg-[#222] rounded-xl box-3d shrink-0 z-50"
					onclick={onclose}
					disabled={loading}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Details -->
			<div class="flex flex-col gap-5 mt-2">
				<!-- Description -->
				<div class="flex flex-col gap-1.5 mt-1">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold"
						>Description</span
					>
					<textarea
						bind:value={addData.description}
						class="bg-transparent text-gray-400 text-base leading-relaxed focus:outline-none w-full resize-none min-h-[48px] p-0 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors"
						placeholder="Add a description..."
					></textarea>
				</div>

				<hr class="border-gray-800/60" />

				<!-- Limit & Period -->
				<div class="flex gap-4 items-end mt-1">
					<div class="flex-1 flex flex-col gap-1.5 border-r border-gray-800/60 pr-4">
						<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold"
							>Limit Amount</span
						>
						<div
							class="flex items-center text-4xl tracking-wide font-bold text-white border-b border-transparent hover:border-gray-700 focus-within:border-current transition-colors w-full pb-0.5"
						>
							<span class="mr-1">₹</span>
							<input
								type="number"
								bind:value={addData.limit_amount}
								placeholder="0"
								class="bg-transparent w-full focus:outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
					</div>
					<div class="flex-1 flex flex-col gap-1.5 relative pl-2">
						<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Period</span>
						<select
							bind:value={addData.period_type}
							class="bg-[#151515] text-gray-100 text-base leading-relaxed focus:outline-none w-full border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1"
						>
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="monthly">Monthly</option>
							<option value="yearly">Yearly</option>
							<option value="manual">Manual</option>
						</select>
					</div>
				</div>

				<hr class="border-gray-800/60" />

				<!-- Reset Date & Icon -->
				<div class="flex gap-4 items-end mt-1">
					<div class="flex-1 flex flex-col gap-1.5 border-r border-gray-800/60 pr-4">
						{#if addData.period_type !== 'daily' && addData.period_type !== 'manual'}
							<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">
								{#if addData.period_type === 'weekly'}
									Reset Day (0=Sun, 6=Sat)
								{:else if addData.period_type === 'monthly'}
									Reset Date (1-31)
								{:else if addData.period_type === 'yearly'}
									Reset Day of Year (1-365)
								{/if}
							</span>
							<div
								class="flex items-center text-2xl tracking-wide font-medium text-white border-b border-transparent hover:border-gray-700 focus-within:border-current transition-colors w-full pb-0.5"
							>
								<input
									type="number"
									bind:value={addData.reset_date}
									class="bg-transparent w-full focus:outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
								/>
							</div>
						{:else}
							<div class="h-[46px]"></div>
							<!-- Spacer -->
						{/if}
					</div>
					<div class="flex-1 flex flex-col gap-1.5 relative pl-2">
						<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Icon</span>
						<button
							class="flex items-center justify-between gap-3 bg-transparent w-full focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-shadow text-left pb-1"
							onclick={() => (isIconDropdownOpen = !isIconDropdownOpen)}
						>
							<div class="flex items-center gap-3 overflow-hidden">
								{#if addData.icon_name && iconMap[addData.icon_name]}
									<picture>
										{#if iconMap[addData.icon_name].avif}
											<source srcset={iconMap[addData.icon_name].avif} type="image/avif" />
										{/if}
										<img
											src={iconMap[addData.icon_name].webp}
											alt=""
											class="h-5 w-5 object-contain shrink-0"
										/>
									</picture>
								{/if}
								<span class="text-gray-100 font-medium truncate text-base"
									>{addData.icon_name || 'Select Icon'}</span
								>
							</div>
							<ChevronDown class="w-4 h-4 text-gray-500 shrink-0" />
						</button>

						{#if isIconDropdownOpen}
							<div
								class="fixed inset-0 z-30"
								onclick={() => (isIconDropdownOpen = false)}
								role="presentation"
							></div>
							<div
								class="absolute right-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-[#1a1a1a] rounded-xl box-3d z-50 p-2 flex flex-col gap-1"
								transition:slide={{ duration: 250, easing: cubicOut }}
							>
								{#each iconsList as icon}
									<button
										class="flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {addData.icon_name ===
										icon.name
											? 'bg-white text-black box-3d'
											: 'text-gray-200 hover:bg-[#2a2a2a]'}"
										onclick={() => {
											addData.icon_name = icon.name;
											isIconDropdownOpen = false;
										}}
									>
										<picture>
											{#if icon.avif}
												<source srcset={icon.avif} type="image/avif" />
											{/if}
											<img src={icon.webp} alt="" class="h-5 w-5 object-contain" />
										</picture>
										<span>{icon.name}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="mt-2 border-t border-gray-800/60 pt-6 flex gap-4">
				<button
					class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]"
					onclick={onclose}
					disabled={loading}>Cancel</button
				>
				<button
					class="flex-1 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
					onclick={handleSave}
					disabled={loading}
				>
					{#if loading}
						<div
							class="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin"
						></div>
					{:else}
						Create Category
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
