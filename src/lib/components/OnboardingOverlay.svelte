<script>
	/**
	 * @fileoverview Mandatory Onboarding Flow.
	 * 3-card initial setup sequence shown to first-time users upon encryption unlock.
	 */
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ChevronRight, ChevronLeft, Check } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import { appData } from '$lib/data.svelte.js';
	import { encryptData, decryptData } from '$lib/crypto';
	import { cryptoStore } from '$lib/cryptoStore.svelte';

	let { onComplete } = $props();

	let step = $state(1);
	let initialBalance = $state('');
	let loading = $state(false);

	function prevStep() {
		if (step > 1) {
			step--;
		}
	}

	async function handleSaveInitialBalance() {
		if (loading) return;

		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) return;

		if (!initialBalance || Number(initialBalance) === 0) {
			step = 3;
			return;
		}

		loading = true;
		try {
			let category_id = appData.corpusBudgets.find(
				(b) => b.category?.toLowerCase() === 'leftover'
			)?.category_id || appData.corpusBudgets[0]?.category_id;

			if (!category_id && cryptoStore.dmk) {
				const { data: rawBudgets } = await supabase
					.from('budgets_encrypted')
					.select('*')
					.eq('user_id', session.user.id);

				if (rawBudgets && rawBudgets.length > 0) {
					for (const row of rawBudgets) {
						try {
							const plaintext = await decryptData(row.encrypted_data, cryptoStore.dmk);
							const parsed = JSON.parse(plaintext);
							if (parsed.budget_type === 'corpus' || parsed.category?.toLowerCase() === 'leftover') {
								category_id = row.category_id;
								break;
							}
						} catch (e) {}
					}
					if (!category_id && rawBudgets[0]?.category_id) {
						category_id = rawBudgets[0].category_id;
					}
				} else {
					// Create the Leftover category if missing
					const newCatId = crypto.randomUUID();
					const payload = {
						category: 'Leftover',
						description: 'Unallocated personal funds',
						limit_amount: 0,
						icon_name: 'wallet',
						budget_type: 'corpus',
						period_type: 'monthly',
						reset_date: 1,
						sort_order: 0,
						last_manual_reset: null
					};
					const enc = await encryptData(payload, cryptoStore.dmk);
					await supabase.from('budgets_encrypted').insert({
						category_id: newCatId,
						user_id: session.user.id,
						encrypted_data: enc
					});
					category_id = newCatId;
				}
			}

			if (cryptoStore.dmk) {
				const todayStr = new Date().toISOString().split('T')[0];
				const payload = {
					amount: Number(initialBalance),
					transaction_type: 'credit',
					title: 'Initial account status',
					description: null,
					category_id: category_id || null,
					transaction_date: todayStr,
					created_at: new Date().toISOString()
				};
				const encryptedData = await encryptData(payload, cryptoStore.dmk);
				const { error } = await supabase.from('transactions_encrypted').insert([
					{
						id: crypto.randomUUID(),
						user_id: session.user.id,
						encrypted_data: encryptedData
					}
				]);
				if (error) {
					console.error('Error saving initial balance:', error);
					alert('Error saving balance: ' + error.message);
					return;
				}
			}

			step = 3;
		} catch (err) {
			console.error('Failed to save initial balance:', err);
		} finally {
			loading = false;
		}
	}

	async function finishOnboarding() {
		loading = true;
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (session) {
			await supabase
				.from('profiles')
				.update({ onboarding_completed: true })
				.eq('id', session.user.id);
		}
		await appData.loadData();
		loading = false;
		onComplete();
	}
</script>

<div
	class="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md text-gray-300 font-sans p-6 flex flex-col items-center justify-center w-full"
	transition:fade={{ duration: 300 }}
>
	<!-- Mascot graphic -->
	<div class="mb-6 pointer-events-none drop-shadow-2xl">
		<img
			src="/mascot.png"
			alt="Mascot"
			class="w-28 h-auto md:w-32 animate-bounce-subtle"
		/>
	</div>

	<!-- Global Go Back -->
	{#if step > 1 && step < 3}
		<button
			class="fixed top-6 left-6 text-gray-300 hover:text-white transition-colors z-[210] font-semibold text-sm tracking-widest bg-black/50 hover:bg-black/70 px-5 py-3 rounded-2xl backdrop-blur-md flex items-center gap-2 box-3d shadow-xl"
			onclick={prevStep}
			transition:fade={{ duration: 200 }}
		>
			<ChevronLeft class="w-5 h-5" /> GO BACK
		</button>
	{/if}

	<div
		class="w-full max-w-lg bg-[#151515] p-8 md:p-10 rounded-[2.5rem] box-3d shadow-2xl relative flex flex-col gap-6"
		in:fly={{ y: 30, duration: 500, easing: cubicOut }}
	>
		<div>
			{#if step === 1}
				<!-- Card 1: Welcome & Tips -->
				<h1 class="text-4xl font-display text-white mb-4 tracking-wide leading-tight">
					Welcome to Green Bar
				</h1>
				<p class="text-gray-400 text-lg leading-relaxed mb-6">
					A purposeful money management app where every rupee gets a job. By setting spending limits upfront and monitoring your budget health in real time, you stay in total control of your finances without the guesswork.
				</p>
				<div class="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl mb-8">
					<strong class="text-white block mb-1">💡 Pro Tip: Install as an App</strong>
					<span class="text-sm text-gray-400">
						Tap your browser's share or menu icon and select <strong>"Add to Home Screen"</strong> for a fast, native-like experience.
					</span>
				</div>
				<button
					class="w-full bg-white text-black font-bold py-4 text-xl rounded-2xl box-3d flex justify-center items-center gap-2 transition-transform active:scale-95 cursor-pointer"
					onclick={() => (step = 2)}
				>
					Get Started <ChevronRight class="w-6 h-6" />
				</button>

			{:else if step === 2}
				<!-- Card 2: Initial Balance -->
				<h1 class="text-4xl font-display text-white mb-4 tracking-wide leading-tight">
					Set Your Starting Balance
				</h1>
				<p class="text-gray-400 text-base leading-relaxed mb-6">
					Enter your current available bank balance to fund your vault. This becomes your unassigned <strong>Leftover</strong> pool, ready to be divided into specific budgets.
				</p>
				<div
					class="flex items-center text-5xl tracking-wide font-bold text-white border-b-2 border-gray-800 focus-within:border-white transition-colors w-full pb-2 mb-8"
				>
					<span class="mr-2 text-gray-500">₹</span>
					<input
						type="number"
						bind:value={initialBalance}
						placeholder="0"
						class="bg-transparent w-full focus:outline-none [-moz-appearance:_textfield] text-white"
					/>
				</div>
				<div class="flex gap-4 flex-col">
					<button
						class="w-full bg-white text-black font-bold py-4 text-xl rounded-2xl box-3d flex justify-center items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
						onclick={handleSaveInitialBalance}
						disabled={loading}
					>
						{loading ? 'Saving...' : 'Save Balance'}
						<ChevronRight class="w-6 h-6" />
					</button>
					<button
						class="text-gray-500 font-medium hover:text-white transition-colors py-2 cursor-pointer text-center"
						onclick={() => (step = 3)}
					>
						Skip for now
					</button>
				</div>

			{:else if step === 3}
				<!-- Card 3: Setup Complete -->
				<div class="text-center flex flex-col items-center">
					<div
						class="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 box-3d border border-gray-800"
					>
						<Check class="w-10 h-10 text-green-500" strokeWidth={3} />
					</div>
					<h1 class="text-4xl font-display text-white mb-4 tracking-wide leading-tight">
						You're Ready to Roll!
					</h1>
					<p class="text-gray-400 text-base leading-relaxed mb-8">
						Your initial balance has been recorded in your private, encrypted vault. Let's head to your dashboard and start organizing your money.
					</p>
					<button
						class="w-full bg-white text-black font-bold py-4 text-xl rounded-2xl box-3d flex justify-center items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
						onclick={finishOnboarding}
						disabled={loading}
					>
						{loading ? 'Entering...' : 'Enter Dashboard'} <ChevronRight class="w-6 h-6" />
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
