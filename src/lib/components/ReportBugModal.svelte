<script>
	import { slide } from 'svelte/transition';
	import { Bug, XCircle, CheckCircle } from 'lucide-svelte';

	let { onclose } = $props();

	let title = $state('');
	let description = $state('');
	let status = $state('idle'); // 'idle', 'loading', 'success', 'error'
	let errorMessage = $state('');

	/** @param {Event} e */
	async function handleSubmit(e) {
		e.preventDefault();
		if (!title.trim() || !description.trim()) return;

		status = 'loading';
		errorMessage = '';

		try {
			const response = await fetch('/api/report-bug', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, description })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to submit bug report');
			}

			status = 'success';
		} catch (error) {
			status = 'error';
			errorMessage = error instanceof Error ? error.message : String(error);
		}
	}
</script>

<div
	class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
>
	<div
		class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative overflow-hidden"
		transition:slide={{ duration: 200 }}
	>
		<div
			class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"
		></div>

		<div class="flex items-center gap-4 relative z-10">
			<div class="p-3 bg-red-500/10 rounded-2xl">
				<Bug class="w-6 h-6 text-red-500" />
			</div>
			<div>
				<h2 class="text-2xl font-display text-white tracking-wide leading-none">Report a Bug</h2>
				<span class="text-red-400 text-xs font-bold uppercase tracking-widest mt-1 block"
					>Help us improve</span
				>
			</div>
		</div>

		<div class="relative z-10">
			{#if status === 'success'}
				<div class="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
					<CheckCircle class="w-10 h-10 text-green-500" />
					<div>
						<h3 class="text-white font-bold text-lg">Thank You!</h3>
						<p class="text-gray-400 text-sm mt-1">Your bug report has been successfully submitted to our developers.</p>
					</div>
					<button
						class="w-full mt-4 py-3 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]"
						onclick={onclose}
					>
						Close
					</button>
				</div>
			{:else}
				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="flex flex-col gap-2">
						<label for="bug-title" class="text-sm text-gray-400 font-medium ml-1">Bug Title</label>
						<input
							id="bug-title"
							type="text"
							bind:value={title}
							placeholder="e.g. Cannot add expense in mobile view"
							required
							disabled={status === 'loading'}
							class="w-full bg-[#111] text-white rounded-xl px-4 py-3 outline-none border border-gray-800 focus:border-red-500/50 transition-colors placeholder-gray-600 font-medium"
						/>
					</div>

					<div class="flex flex-col gap-2">
						<label for="bug-desc" class="text-sm text-gray-400 font-medium ml-1">Description</label>
						<textarea
							id="bug-desc"
							bind:value={description}
							placeholder="Please describe what happened, what you expected, and how to reproduce it..."
							required
							disabled={status === 'loading'}
							rows="4"
							class="w-full bg-[#111] text-white rounded-xl px-4 py-3 outline-none border border-gray-800 focus:border-red-500/50 transition-colors placeholder-gray-600 text-sm resize-none"
						></textarea>
					</div>

					{#if status === 'error'}
						<div class="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl flex items-start gap-2 border border-red-500/20">
							<XCircle class="w-5 h-5 shrink-0" />
							<span>{errorMessage}</span>
						</div>
					{/if}

					<div class="flex gap-3 pt-2">
						<button
							type="button"
							class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98] disabled:opacity-50"
							onclick={onclose}
							disabled={status === 'loading'}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={status === 'loading'}
							class="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-400 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
						>
							{#if status === 'loading'}
								<div class="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
							{:else}
								Submit Bug
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
