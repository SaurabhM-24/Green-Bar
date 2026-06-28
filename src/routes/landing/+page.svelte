<script>
	import { fade, slide, scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ChevronRight, Target, Gamepad2, CheckCircle2, Smartphone } from 'lucide-svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Github from '$lib/components/Github.svelte';
</script>

<div
	class="bg-black text-gray-300 font-sans min-h-screen flex flex-col w-full selection:bg-green-900 selection:text-green-100"
>
	<!-- Navigation -->
	<nav
		class="w-full flex items-center justify-between p-6 max-w-5xl mx-auto z-10 sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-900"
	>
		<div class="flex items-center gap-3">
			<img src="/icon-192x192.png" alt="Green Bar Logo" class="w-8 h-8 object-contain" />
			<span class="text-white font-display text-xl tracking-widest uppercase mt-1">Green Bar</span>
		</div>
		<div class="flex items-center gap-4">
			<a
				href="/login"
				class="text-gray-400 hover:text-white transition-colors text-sm font-medium hidden sm:block"
				>Log In</a
			>
			<a
				href="/login?mode=signup"
				class="bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
				>Sign Up</a
			>
		</div>
	</nav>

	<main
		class="flex-1 w-full max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col gap-32 overflow-x-hidden"
	>
		<!-- Hero Section -->
		<section
			class="flex flex-col items-center text-center mt-8 sm:mt-12"
			in:fly={{ y: 30, duration: 800, delay: 200, easing: cubicOut }}
		>
			<div
				class="inline-block px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium mb-6"
			>
				Zero-Based Budgeting, Reimagined.
			</div>
			<h1
				class="text-5xl md:text-7xl font-display text-white mb-6 tracking-wide leading-tight max-w-3xl"
			>
				Give Every Rupee a <span
					class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600"
					>Job.</span
				>
			</h1>
			<p class="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
				Stop wondering where your money went. Start telling it where to go. Green Bar is a gamified
				budget tracker that puts you in total control of your finances.
			</p>

			<div class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
				<a
					href="/login?mode=signup"
					class="w-full sm:w-auto bg-white text-black font-bold py-4 px-8 text-lg rounded-full box-3d transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
				>
					Create Your Vault <ChevronRight class="w-5 h-5" />
				</a>
			</div>
			<p class="mt-6 text-gray-500 text-sm sm:hidden">
				Already have an account? <a href="/login" class="text-white hover:underline font-medium"
					>Log In</a
				>
			</p>
		</section>

		<!-- The Problem vs Solution -->
		<section
			class="flex flex-col md:flex-row gap-12 items-center"
			in:fly={{ y: 30, duration: 800, delay: 400, easing: cubicOut }}
		>
			<div class="flex-1 space-y-6">
				<h2 class="text-3xl md:text-5xl font-display text-white tracking-wide">
					Budgeting, Reimagined.
				</h2>
				<div class="space-y-4 text-gray-400 text-lg leading-relaxed">
					<p>
						Most finance apps are just digital receipts—they guilt-trip you about money you've
						already spent.
					</p>
					<p>
						Green Bar uses <strong>Zero-Based Budgeting</strong>. You start by putting all your
						available money into your Personal Corpus, and then you assign every single rupee to a
						specific category.
					</p>
					<p class="text-white font-medium border-l-2 border-green-500 pl-4 py-1">
						When your money has a mission, accidental overspending disappears.
					</p>
				</div>
			</div>
			<div
				class="flex-1 w-full bg-[#111] rounded-3xl p-8 border border-gray-800 box-3d relative overflow-hidden group"
			>
				<div
					class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
				></div>
				<Target class="w-12 h-12 text-green-500 mb-6" />
				<h3 class="text-2xl text-white font-display mb-3">Intentional Spending</h3>
				<p class="text-gray-400 leading-relaxed">
					Allocate your funds upfront. Track your daily limits. Turn expense management into a game
					you can actually win.
				</p>
			</div>
		</section>

		<!-- Core Features -->
		<section
			class="flex flex-col gap-12"
			in:fly={{ y: 30, duration: 800, delay: 600, easing: cubicOut }}
		>
			<div class="text-center max-w-2xl mx-auto">
				<h2 class="text-3xl md:text-5xl font-display text-white tracking-wide mb-6">
					How Green Bar Works
				</h2>
				<p class="text-gray-400 text-lg">
					Break down your finances into three simple, manageable pillars.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Corpus -->
				<div
					class="bg-[#0a0a0a] rounded-3xl p-8 border border-gray-800 hover:border-gray-700 transition-colors box-3d flex flex-col items-start gap-5"
				>
					<div
						class="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800"
					>
						<span class="text-2xl">🏦</span>
					</div>
					<div>
						<h3 class="text-xl text-white font-medium tracking-wide mb-1">The Personal Corpus</h3>
						<span class="text-xs text-green-400 uppercase tracking-widest font-bold"
							>Your Headquarters</span
						>
					</div>
					<p class="text-gray-400 text-sm leading-relaxed flex-1">
						All your liquid money starts here. When payday hits, your Corpus fills up. Distribute
						funds or "Lock" a portion out of sight for emergencies.
					</p>
				</div>

				<!-- Variable -->
				<div
					class="bg-[#0a0a0a] rounded-3xl p-8 border border-gray-800 hover:border-gray-700 transition-colors box-3d flex flex-col items-start gap-5"
				>
					<div
						class="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800"
					>
						<Gamepad2 class="w-6 h-6 text-white" />
					</div>
					<div>
						<h3 class="text-xl text-white font-medium tracking-wide mb-1">Variable Expenses</h3>
						<span class="text-xs text-green-400 uppercase tracking-widest font-bold"
							>Play the Game</span
						>
					</div>
					<p class="text-gray-400 text-sm leading-relaxed flex-1">
						Set strict limits for day-to-day spending. Every time you log an expense, your bar fills
						up. Your only goal? Keep the bar green.
					</p>
				</div>

				<!-- Fixed -->
				<div
					class="bg-[#0a0a0a] rounded-3xl p-8 border border-gray-800 hover:border-gray-700 transition-colors box-3d flex flex-col items-start gap-5"
				>
					<div
						class="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800"
					>
						<CheckCircle2 class="w-6 h-6 text-white" />
					</div>
					<div>
						<h3 class="text-xl text-white font-medium tracking-wide mb-1">Fixed Expenses</h3>
						<span class="text-xs text-green-400 uppercase tracking-widest font-bold"
							>Set It & Forget It</span
						>
					</div>
					<p class="text-gray-400 text-sm leading-relaxed flex-1">
						Rent, EMIs, and subscriptions isolated into a simple checklist. Secure the exact amount
						needed and mark them as Paid.
					</p>
				</div>
			</div>
		</section>

		<!-- Tech Advantage -->
		<section
			class="bg-gradient-to-br from-[#111] to-black border border-gray-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 box-3d"
			in:fly={{ y: 30, duration: 800, delay: 800, easing: cubicOut }}
		>
			<div class="flex-1 space-y-6">
				<h2 class="text-3xl md:text-4xl font-display text-white tracking-wide">
					Designed for Your Phone.<br />Built for Peace of Mind.
				</h2>
				<p class="text-gray-400 text-lg leading-relaxed">
					Green Bar is a mobile-first web experience. No app stores, no heavy downloads.
				</p>
				<p class="text-gray-400 text-lg leading-relaxed">
					<strong class="text-white">Zero Friction:</strong> Simply log in from your browser, tap "Add
					to Home Screen", and instantly get a lightning-fast, native app experience right next to your
					other apps. Your data syncs instantly and securely.
				</p>
			</div>
			<div class="w-full md:w-1/3 flex justify-center">
				<div
					class="w-48 h-96 border-[8px] border-gray-900 rounded-[3rem] bg-black relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center"
				>
					<Smartphone class="w-16 h-16 text-gray-800" strokeWidth={1} />
					<div class="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl mx-12"></div>
				</div>
			</div>
		</section>

		<!-- Final CTA -->
		<section
			class="text-center py-12 flex flex-col items-center"
			in:fly={{ y: 30, duration: 800, delay: 1000, easing: cubicOut }}
		>
			<h2 class="text-4xl md:text-5xl font-display text-white tracking-wide mb-6">
				Ready to master your money?
			</h2>
			<p class="text-gray-400 text-xl mb-10">Your vault is empty. Let's fix that.</p>
			<a
				href="/login?mode=signup"
				class="inline-flex bg-white text-black font-bold py-5 px-10 text-xl rounded-full box-3d transition-all active:scale-95 items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
			>
				Get Started for Free <ChevronRight class="w-6 h-6" />
			</a>

			<div class="mt-20 flex flex-col items-center gap-4">
				<p class="text-gray-600 text-sm font-medium uppercase tracking-widest">
					Are you a developer?
				</p>
				<a
					href="https://github.com/SaurabhM-24/Green-Bar"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 hover:text-white transition-colors bg-[#111] px-6 py-3.5 rounded-full border border-gray-800 hover:border-gray-700 box-3d text-gray-400"
				>
					<Github class="w-5 h-5" />
					<span class="text-sm font-bold tracking-wide">View Source on GitHub</span>
				</a>
			</div>
		</section>
	</main>

	<div class="mt-auto w-full max-w-5xl mx-auto px-6">
		<Footer />
	</div>
</div>
