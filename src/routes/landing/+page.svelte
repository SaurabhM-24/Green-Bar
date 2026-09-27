<script>
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		ChevronRight,
		ShieldCheck,
		Lock,
		KeyRound,
		Fingerprint,
		Smartphone,
		Share2,
		Sparkles,
		CheckCircle2,
		Gamepad2,
		Target,
		EyeOff,
		Check,
		Layers,
		ArrowUpRight,
		Code2,
		Zap
	} from 'lucide-svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Github from '$lib/components/Github.svelte';
</script>

<svelte:head>
	<title>Green Bar | Gamified Zero-Based Budgeting with Absolute Privacy</title>
	<meta
		name="description"
		content="Stop wondering where your money went. Green Bar is a mobile-first, zero-based budget tracker with client-side zero-knowledge encryption, biometric unlocking, and open-source transparency."
	/>
</svelte:head>

<div
	class="bg-black text-gray-300 font-sans min-h-screen flex flex-col w-full selection:bg-green-500 selection:text-black"
>
	<!-- Sticky Top Navigation -->
	<header
		class="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-md border-b border-zinc-800/80 transition-all"
	>
		<div
			class="w-full max-w-6xl mx-auto px-6 sm:px-8 md:px-10 h-16 sm:h-20 flex items-center justify-between gap-4"
		>
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2.5 sm:gap-3 group">
				<img
					src="/icon-192x192.png"
					alt="Green Bar Logo"
					class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_12px_rgba(74,222,128,0.25)] transition-transform group-hover:scale-105"
				/>
				<span
					class="text-white font-display text-lg sm:text-xl tracking-wider uppercase mt-0.5 group-hover:text-green-400 transition-colors"
					>Green Bar</span
				>
			</a>

			<!-- Center Trust Pill (Desktop/Tablet) -->
			<div
				class="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-xs text-zinc-300 shadow-sm"
			>
				<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
				<span class="font-medium">100% Client-Side Encrypted</span>
				<span class="text-zinc-600">•</span>
				<span class="text-zinc-400">Open Source</span>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-2.5 sm:gap-4">
				<a
					href="https://github.com/SaurabhM-24/Green-Bar"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="GitHub Repository"
					class="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
				>
					<Github class="w-4 h-4" />
				</a>

				<a
					href="/login"
					class="text-zinc-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
				>
					Log In
				</a>

				<a
					href="/login?mode=signup"
					class="bg-white hover:bg-zinc-200 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 box-3d shadow-[3px_3px_0px_0px_#22c55e] hover:shadow-[4px_4px_0px_0px_#22c55e]"
				>
					Sign Up
				</a>
			</div>
		</div>
	</header>

	<main
		class="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-8 md:px-10 pt-10 sm:pt-16 pb-24 flex flex-col gap-24 sm:gap-36 overflow-x-hidden"
	>
		<!-- ========================================================================= -->
		<!-- HERO SECTION -->
		<!-- ========================================================================= -->
		<section
			class="flex flex-col items-center text-center max-w-4xl mx-auto pt-2 sm:pt-8"
			in:fly={{ y: 24, duration: 700, easing: cubicOut }}
		>
			<!-- Badges -->
			<div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
				<span
					class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs sm:text-sm font-semibold"
				>
					<Target class="w-3.5 h-3.5" />
					Zero-Based Budgeting
				</span>
				<span
					class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-300 text-xs sm:text-sm font-semibold"
				>
					<ShieldCheck class="w-3.5 h-3.5 text-green-400" />
					Biometric Client-Side Encryption
				</span>
				<span
					class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 text-xs sm:text-sm font-semibold"
				>
					<Code2 class="w-3.5 h-3.5" />
					Free & Open Source
				</span>
			</div>

			<!-- Main Headline -->
			<h1
				class="text-4xl sm:text-6xl md:text-7xl font-display text-white mb-6 tracking-wide leading-[1.1] max-w-3xl"
			>
				Give Every Rupee a <span
					class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 underline decoration-green-500/40 decoration-wavy decoration-2"
					>Job.</span
				>
			</h1>

			<!-- Subtitle -->
			<p class="text-zinc-400 text-base sm:text-xl leading-relaxed mb-8 sm:mb-10 max-w-2xl px-2">
				Stop wondering where your money went. Start telling it where to go. Green Bar is an
				open-source, gamified budget tracker engineered with zero-knowledge encryption so your
				finances remain strictly between you and your device.
			</p>

			<!-- Action Buttons -->
			<div
				class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none"
			>
				<a
					href="/login?mode=signup"
					class="w-full sm:w-auto bg-white text-black font-bold py-3.5 sm:py-4 px-8 text-base sm:text-lg rounded-full box-3d transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#22c55e] hover:shadow-[5px_5px_0px_0px_#22c55e]"
				>
					Create Your Vault <ChevronRight class="w-5 h-5 text-black" />
				</a>

				<a
					href="https://github.com/SaurabhM-24/Green-Bar"
					target="_blank"
					rel="noopener noreferrer"
					class="w-full sm:w-auto bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold py-3.5 sm:py-4 px-6 text-base rounded-full border border-zinc-700/80 box-3d transition-all active:scale-95 flex items-center justify-center gap-2.5"
				>
					<Github class="w-5 h-5" />
					<span>Explore GitHub</span>
					<ArrowUpRight class="w-4 h-4 text-zinc-400" />
				</a>
			</div>

			<p class="mt-4 text-zinc-500 text-xs sm:text-sm">
				Already have an account?
				<a href="/login" class="text-green-400 hover:underline font-semibold ml-1">Log In</a>
			</p>

			<!-- Hero Phone Mockup Preview with Floating Badges -->
			<div class="mt-12 sm:mt-16 w-full max-w-xs sm:max-w-sm md:max-w-md relative flex justify-center">
				<!-- Ambient Glow behind phone -->
				<div
					class="absolute -inset-4 bg-gradient-to-t from-green-500/20 via-green-500/5 to-transparent blur-3xl -z-10 rounded-full"
				></div>

				<!-- Floating Badge 1 (Left on desktop, top-left on mobile) -->
				<div
					class="absolute -left-2 sm:-left-12 top-6 sm:top-16 z-30 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-2 sm:p-3 box-3d shadow-[4px_4px_0px_0px_#18181b] flex items-center gap-2 sm:gap-2.5 scale-90 sm:scale-100 origin-left animate-bounce [animation-duration:3s]"
				>
					<div
						class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0"
					>
						<ShieldCheck class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
					</div>
					<div class="text-left">
						<p class="text-[10px] sm:text-xs text-zinc-400 font-medium leading-none">Zero-Knowledge</p>
						<p class="text-xs sm:text-sm text-white font-bold mt-0.5">Device Encrypted</p>
					</div>
				</div>

				<!-- Floating Badge 2 (Right on desktop, bottom-right on mobile) -->
				<div
					class="absolute -right-2 sm:-right-12 bottom-8 sm:bottom-20 z-30 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-2 sm:p-3 box-3d shadow-[4px_4px_0px_0px_#18181b] flex items-center gap-2 sm:gap-2.5 scale-90 sm:scale-100 origin-right animate-bounce [animation-duration:3.4s]"
				>
					<div
						class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0"
					>
						<Gamepad2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
					</div>
					<div class="text-left">
						<p class="text-[10px] sm:text-xs text-zinc-400 font-medium leading-none">Gamified Limit</p>
						<p class="text-xs sm:text-sm text-white font-bold mt-0.5">Keep The Bar Green</p>
					</div>
				</div>

				<!-- Phone Frame Chassis -->
				<div
					class="w-full border-4 sm:border-[8px] border-zinc-800 bg-zinc-950 rounded-[2.6rem] sm:rounded-[3rem] p-1.5 sm:p-2 box-3d shadow-[8px_8px_0px_0px_#18181b] relative overflow-hidden"
				>
					<!-- Notch / Dynamic Island -->
					<div
						class="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-4 sm:h-5 bg-black rounded-full z-20 flex items-center justify-end px-2"
					>
						<div class="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800"></div>
					</div>

					<!-- Screen Inner -->
					<div
						class="rounded-[2.1rem] sm:rounded-[2.4rem] overflow-hidden bg-black aspect-[1320/2867] relative"
					>
						<img
							src="/screenshots/home-1.png"
							alt="Green Bar Home Dashboard"
							class="w-full h-full object-cover select-none"
							loading="eager"
						/>
						<!-- Screen Gloss -->
						<div
							class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"
						></div>
					</div>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- PROBLEM VS SOLUTION: BUDGETING REIMAGINED -->
		<!-- ========================================================================= -->
		<section class="flex flex-col gap-8 max-w-4xl mx-auto w-full">
			<div class="text-center space-y-3">
				<span class="text-xs sm:text-sm text-green-400 font-bold uppercase tracking-widest block">
					The Philosophy
				</span>
				<h2 class="text-3xl sm:text-5xl font-display text-white tracking-wide">
					Budgeting, Reimagined.
				</h2>
				<p class="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
					Traditional budgeting apps fail because they work backwards. Here is how Green Bar fixes
					it.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mt-2">
				<!-- Old Way Card -->
				<div
					class="bg-[#0e0e11] border-2 border-red-950/40 rounded-3xl p-6 sm:p-8 box-3d flex flex-col justify-between gap-6"
				>
					<div class="space-y-4">
						<div
							class="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-lg"
						>
							✕
						</div>
						<h3 class="text-xl sm:text-2xl font-display text-white">The Digital Receipt Trap</h3>
						<p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
							Most apps simply record what you've already spent and show angry red graphs. They
							guilt-trip you in hindsight without giving you a concrete plan upfront.
						</p>
					</div>
					<ul class="space-y-2.5 text-xs sm:text-sm text-zinc-400 border-t border-zinc-800/80 pt-4">
						<li class="flex items-center gap-2 text-red-300">
							<span class="text-red-500 font-bold">✕</span> Retroactive guilt instead of proactive control
						</li>
						<li class="flex items-center gap-2 text-red-300">
							<span class="text-red-500 font-bold">✕</span> Bank syncs constantly breaking & disconnecting
						</li>
						<li class="flex items-center gap-2 text-red-300">
							<span class="text-red-500 font-bold">✕</span> Sensitive financial data stored unencrypted
						</li>
					</ul>
				</div>

				<!-- Green Bar Way Card -->
				<div
					class="bg-[#0e0e11] border-2 border-green-500/40 rounded-3xl p-6 sm:p-8 box-3d shadow-[4px_4px_0px_0px_#22c55e] flex flex-col justify-between gap-6 relative overflow-hidden"
				>
					<div
						class="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-2xl pointer-events-none rounded-full"
					></div>

					<div class="space-y-4 relative z-10">
						<div
							class="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-lg"
						>
							✓
						</div>
						<h3 class="text-xl sm:text-2xl font-display text-white">The Zero-Based Mission</h3>
						<p class="text-zinc-300 text-sm sm:text-base leading-relaxed">
							Green Bar gives every rupee a mission before you spend it. All funds start in your
							central Leftover, get assigned to categories, and accidental overspending simply
							vanishes.
						</p>
					</div>

					<ul
						class="space-y-2.5 text-xs sm:text-sm text-zinc-300 border-t border-zinc-800/80 pt-4 relative z-10"
					>
						<li class="flex items-center gap-2 text-green-300">
							<Check class="w-4 h-4 text-green-400 shrink-0" /> Zero-based budgeting: every rupee is assigned
						</li>
						<li class="flex items-center gap-2 text-green-300">
							<Check class="w-4 h-4 text-green-400 shrink-0" /> Gamified progress bars: keep the bar green
						</li>
						<li class="flex items-center gap-2 text-green-300">
							<Check class="w-4 h-4 text-green-400 shrink-0" /> 100% Client-side zero-knowledge encryption
						</li>
					</ul>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- CORE PILLAR 1: THE LEFTOVER (PERSONAL CORPUS) -->
		<!-- ========================================================================= -->
		<section class="flex flex-col md:flex-row items-center gap-10 md:gap-14">
			<!-- Text Content -->
			<div class="flex-1 space-y-6 text-left order-1 md:order-1">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-green-400 text-xs font-bold uppercase tracking-wider">
					<span>Pillar 01</span>
					<span class="text-zinc-600">•</span>
					<span>Financial Headquarters</span>
				</div>

				<h2 class="text-3xl sm:text-5xl font-display text-white leading-tight">
					The Leftover: Control the Source.
				</h2>

				<p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
					All your liquid money starts in one unified reservoir. When payday hits, your Leftover fills
					up. From this headquarters, you strategically allocate funds into your daily life.
				</p>

				<div class="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 box-3d space-y-3">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
							<Lock class="w-4 h-4" />
						</div>
						<h4 class="text-white font-bold text-sm sm:text-base">Out of Sight Emergency Locking</h4>
					</div>
					<p class="text-zinc-400 text-xs sm:text-sm leading-relaxed">
						Want to preserve a buffer for medical or rainy days? Simply "Lock" a portion of your Leftover.
						Locked funds stay invisible from your daily spending calculations so you're never tempted to spend them.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3 pt-2">
					<div class="border border-zinc-800/80 bg-zinc-950/60 p-3 rounded-xl">
						<p class="text-green-400 font-display text-lg sm:text-xl">Zero Debt</p>
						<p class="text-zinc-500 text-xs mt-0.5">Spend only what you actually possess</p>
					</div>
					<div class="border border-zinc-800/80 bg-zinc-950/60 p-3 rounded-xl">
						<p class="text-white font-display text-lg sm:text-xl">Total Clarity</p>
						<p class="text-zinc-500 text-xs mt-0.5">Know your true unallocated cash</p>
					</div>
				</div>
			</div>

			<!-- Phone Mockup -->
			<div class="w-full max-w-[270px] sm:max-w-xs md:flex-1 flex justify-center order-2 md:order-2">
				<div class="w-full border-4 sm:border-[6px] border-zinc-800 bg-zinc-950 rounded-[2.5rem] p-1.5 box-3d shadow-[6px_6px_0px_0px_#18181b]">
					<!-- Notch -->
					<div class="w-20 h-3.5 bg-black rounded-full mx-auto mb-1"></div>
					<div class="rounded-[2.1rem] overflow-hidden bg-black aspect-[1320/2867] relative">
						<img
							src="/screenshots/balance-1.png"
							alt="Leftover and Corpus Management"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- CORE PILLAR 2: VARIABLE EXPENSES -->
		<!-- ========================================================================= -->
		<section class="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-14">
			<!-- Text Content -->
			<div class="flex-1 space-y-6 text-left order-1 md:order-1">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-green-400 text-xs font-bold uppercase tracking-wider">
					<span>Pillar 02</span>
					<span class="text-zinc-600">•</span>
					<span>Day-to-Day Spending</span>
				</div>

				<h2 class="text-3xl sm:text-5xl font-display text-white leading-tight">
					Variable Budgets: Keep the Bar Green.
				</h2>

				<p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
					Dining out, coffees, groceries, impulsive shopping, weekend outings. For every fluid category, you define a clear ceiling. Every rupee spent fills the progress bar.
				</p>

				<div class="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 box-3d space-y-3">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
							<Gamepad2 class="w-4 h-4" />
						</div>
						<h4 class="text-white font-bold text-sm sm:text-base">Turn Budgeting Into a Game</h4>
					</div>
					<p class="text-zinc-400 text-xs sm:text-sm leading-relaxed">
						When you stay within your limits, your bar stays a healthy bright green. Overspending turns it amber and red. Your only objective for the month? Keep the bar green.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3 pt-2">
					<div class="border border-zinc-800/80 bg-zinc-950/60 p-3 rounded-xl">
						<p class="text-green-400 font-display text-lg sm:text-xl">3 Seconds</p>
						<p class="text-zinc-500 text-xs mt-0.5">Quick transaction logging</p>
					</div>
					<div class="border border-zinc-800/80 bg-zinc-950/60 p-3 rounded-xl">
						<p class="text-white font-display text-lg sm:text-xl">Instant Reset</p>
						<p class="text-zinc-500 text-xs mt-0.5">Monthly or custom cycles</p>
					</div>
				</div>
			</div>

			<!-- Phone Mockup -->
			<div class="w-full max-w-[270px] sm:max-w-xs md:flex-1 flex justify-center order-2 md:order-2">
				<div class="w-full border-4 sm:border-[6px] border-zinc-800 bg-zinc-950 rounded-[2.5rem] p-1.5 box-3d shadow-[6px_6px_0px_0px_#18181b]">
					<!-- Notch -->
					<div class="w-20 h-3.5 bg-black rounded-full mx-auto mb-1"></div>
					<div class="rounded-[2.1rem] overflow-hidden bg-black aspect-[1320/2867] relative">
						<img
							src="/screenshots/variables-1.png"
							alt="Variable Budget Categories"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- CORE PILLAR 3: FIXED EXPENSES -->
		<!-- ========================================================================= -->
		<section class="flex flex-col md:flex-row items-center gap-10 md:gap-14">
			<!-- Text Content -->
			<div class="flex-1 space-y-6 text-left order-1 md:order-1">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-green-400 text-xs font-bold uppercase tracking-wider">
					<span>Pillar 03</span>
					<span class="text-zinc-600">•</span>
					<span>Obligations & Bills</span>
				</div>

				<h2 class="text-3xl sm:text-5xl font-display text-white leading-tight">
					Fixed Expenses: Set It, Tick It, Forget It.
				</h2>

				<p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
					Rent, EMIs, WiFi, and recurring utility bills don't need daily progress bars. Green Bar isolates your non-negotiables into an intentional monthly checklist.
				</p>

				<div class="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 box-3d space-y-3">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
							<CheckCircle2 class="w-4 h-4" />
						</div>
						<h4 class="text-white font-bold text-sm sm:text-base">Ring-Fence Your Must-Haves</h4>
					</div>
					<p class="text-zinc-400 text-xs sm:text-sm leading-relaxed">
						Lock down the exact amount needed for all obligations on day 1. As bills clear, tick them off as Paid. What remains in your Leftover is 100% guilt-free to spend.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3 pt-2">
					<div class="border border-zinc-800/80 bg-zinc-950/60 p-3 rounded-xl">
						<p class="text-green-400 font-display text-lg sm:text-xl">Zero Surprises</p>
						<p class="text-zinc-500 text-xs mt-0.5">Bills funded before leisure</p>
					</div>
					<div class="border border-zinc-800/80 bg-zinc-950/60 p-3 rounded-xl">
						<p class="text-white font-display text-lg sm:text-xl">One-Tap Paid</p>
						<p class="text-zinc-500 text-xs mt-0.5">Instant checklist status</p>
					</div>
				</div>
			</div>

			<!-- Phone Mockup -->
			<div class="w-full max-w-[270px] sm:max-w-xs md:flex-1 flex justify-center order-2 md:order-2">
				<div class="w-full border-4 sm:border-[6px] border-zinc-800 bg-zinc-950 rounded-[2.5rem] p-1.5 box-3d shadow-[6px_6px_0px_0px_#18181b]">
					<!-- Notch -->
					<div class="w-20 h-3.5 bg-black rounded-full mx-auto mb-1"></div>
					<div class="rounded-[2.1rem] overflow-hidden bg-black aspect-[1320/2867] relative">
						<img
							src="/screenshots/fixed-view-card.png"
							alt="Fixed Expenses View Card"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- CORE PILLAR 4: ABSOLUTE PRIVACY & CLIENT-SIDE ENCRYPTION -->
		<!-- ========================================================================= -->
		<section
			class="bg-gradient-to-b from-zinc-950 via-[#0d0d10] to-black border-2 border-zinc-800 rounded-3xl p-6 sm:p-10 md:p-12 box-3d relative overflow-hidden"
		>
			<div
				class="absolute -top-24 -right-24 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none"
			></div>

			<div class="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-14 relative z-10">
				<!-- Text Content -->
				<div class="flex-1 space-y-6 text-left">
					<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider">
						<ShieldCheck class="w-3.5 h-3.5" />
						<span>Absolute Privacy • Zero-Knowledge Architecture</span>
					</div>

					<h2 class="text-3xl sm:text-5xl font-display text-white leading-tight">
						Your Data. Encrypted on Device. Accessible Only by You.
					</h2>

					<p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
						Most finance apps store your transaction amounts and balances in plaintext on centralized databases.
						<strong class="text-white">Green Bar does the exact opposite.</strong>
					</p>

					<p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
						Using military-grade AES-256-GCM encryption with WebAuthn PRF, all amounts and transaction descriptions are encrypted directly inside your device's browser memory before touching the cloud.
					</p>

					<!-- Security Pillars Grid -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
						<div class="bg-black/60 border border-zinc-800 p-4 rounded-2xl box-3d space-y-1.5">
							<div class="flex items-center gap-2 text-green-400 font-bold text-sm">
								<Fingerprint class="w-4 h-4" />
								<span>Biometric Unlock</span>
							</div>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Unlock with Touch ID, Face ID, or Passkeys. Your private key stays secured in your hardware enclave.
							</p>
						</div>

						<div class="bg-black/60 border border-zinc-800 p-4 rounded-2xl box-3d space-y-1.5">
							<div class="flex items-center gap-2 text-green-400 font-bold text-sm">
								<KeyRound class="w-4 h-4" />
								<span>Secondary PIN</span>
							</div>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Access from any secondary device using your secret PIN. Zero passwords sent to the server.
							</p>
						</div>

						<div class="bg-black/60 border border-zinc-800 p-4 rounded-2xl box-3d space-y-1.5">
							<div class="flex items-center gap-2 text-green-400 font-bold text-sm">
								<EyeOff class="w-4 h-4" />
								<span>Zero Plaintext in Cloud</span>
							</div>
							<p class="text-zinc-400 text-xs leading-relaxed">
								The database only ever sees scrambled ciphertext strings. Even in a breach, your data is unreadable.
							</p>
						</div>

						<div class="bg-black/60 border border-zinc-800 p-4 rounded-2xl box-3d space-y-1.5">
							<div class="flex items-center gap-2 text-green-400 font-bold text-sm">
								<Lock class="w-4 h-4" />
								<span>You Hold the Only Key</span>
							</div>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Neither the app creators nor server administrators can view your financial numbers.
							</p>
						</div>
					</div>
				</div>

				<!-- Phone Mockup of Secure Vault Gate -->
				<div class="w-full max-w-[270px] sm:max-w-xs md:flex-1 flex justify-center">
					<div class="w-full border-4 sm:border-[6px] border-zinc-800 bg-zinc-950 rounded-[2.5rem] p-1.5 box-3d shadow-[6px_6px_0px_0px_#22c55e]">
						<!-- Notch -->
						<div class="w-20 h-3.5 bg-black rounded-full mx-auto mb-1"></div>
						<div class="rounded-[2.1rem] overflow-hidden bg-black aspect-[1320/2867] relative">
							<img
								src="/screenshots/secure-vault.png"
								alt="Green Bar Biometric and PIN Vault Screen"
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- CORE PILLAR 5: 100% FREE & OPEN SOURCE -->
		<!-- ========================================================================= -->
		<section
			class="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-6 sm:p-10 box-3d flex flex-col md:flex-row items-center justify-between gap-8"
		>
			<div class="flex-1 space-y-4 text-left">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-green-400 text-xs font-bold uppercase tracking-wider">
					<Code2 class="w-3.5 h-3.5" />
					<span>100% Free & Open Source</span>
				</div>

				<h2 class="text-3xl sm:text-4xl font-display text-white leading-tight">
					Transparent Code. Zero Corporate Surveillance.
				</h2>

				<p class="text-zinc-400 text-base leading-relaxed">
					Green Bar is free, open source, and built for people who believe financial tools should work for them—not monetize them.
				</p>

				<div class="flex flex-wrap gap-4 text-xs sm:text-sm text-zinc-300 pt-2">
					<span class="flex items-center gap-1.5">
						<Check class="w-4 h-4 text-green-400" /> No ads or sponsored credit cards
					</span>
					<span class="flex items-center gap-1.5">
						<Check class="w-4 h-4 text-green-400" /> Zero tracking or behavioral telemetry
					</span>
					<span class="flex items-center gap-1.5">
						<Check class="w-4 h-4 text-green-400" /> MIT Licensed & peer auditable
					</span>
				</div>
			</div>

			<div class="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
				<a
					href="https://github.com/SaurabhM-24/Green-Bar"
					target="_blank"
					rel="noopener noreferrer"
					class="bg-white hover:bg-zinc-200 text-black px-6 py-4 rounded-2xl font-bold text-sm box-3d transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#22c55e]"
				>
					<Github class="w-5 h-5 text-black" />
					<span>Inspect Code on GitHub</span>
					<ArrowUpRight class="w-4 h-4" />
				</a>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- CORE PILLAR 6: MOBILE WEB EXPERIENCE / PWA GUIDE -->
		<!-- ========================================================================= -->
		<section class="flex flex-col md:flex-row items-center gap-10 md:gap-14">
			<!-- Text & Step Guide -->
			<div class="flex-1 space-y-6 text-left order-1 md:order-1">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-green-400 text-xs font-bold uppercase tracking-wider">
					<Smartphone class="w-3.5 h-3.5" />
					<span>Mobile Web Experience</span>
				</div>

				<h2 class="text-3xl sm:text-5xl font-display text-white leading-tight">
					Designed for Your Phone. Zero App Store Friction.
				</h2>

				<p class="text-zinc-400 text-base sm:text-lg leading-relaxed">
					No heavy downloads from app stores. No recurring update prompts. Green Bar is a Progressive Web App (PWA) that installs straight from your browser in 3 seconds.
				</p>

				<!-- 3-Step Install Flow -->
				<div class="space-y-3 pt-2">
					<div class="flex items-start gap-3.5 bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl box-3d">
						<span class="w-7 h-7 rounded-xl bg-zinc-800 text-green-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
						<div>
							<h4 class="text-white font-bold text-sm">Open in Your Phone's Browser</h4>
							<p class="text-zinc-400 text-xs mt-0.5">Visit Green Bar in Safari, Chrome, or Firefox.</p>
						</div>
					</div>

					<div class="flex items-start gap-3.5 bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl box-3d">
						<span class="w-7 h-7 rounded-xl bg-zinc-800 text-green-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
						<div>
							<h4 class="text-white font-bold text-sm">Tap Share & Select "Add to Home Screen"</h4>
							<p class="text-zinc-400 text-xs mt-0.5">Takes one single tap on iOS or Android.</p>
						</div>
					</div>

					<div class="flex items-start gap-3.5 bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl box-3d">
						<span class="w-7 h-7 rounded-xl bg-zinc-800 text-green-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
						<div>
							<h4 class="text-white font-bold text-sm">Instant Native Experience</h4>
							<p class="text-zinc-400 text-xs mt-0.5">Opens full-screen alongside your native apps with instant load times.</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Phone Mockup -->
			<div class="w-full max-w-[270px] sm:max-w-xs md:flex-1 flex justify-center order-2 md:order-2">
				<div class="w-full border-4 sm:border-[6px] border-zinc-800 bg-zinc-950 rounded-[2.5rem] p-1.5 box-3d shadow-[6px_6px_0px_0px_#18181b]">
					<!-- Notch -->
					<div class="w-20 h-3.5 bg-black rounded-full mx-auto mb-1"></div>
					<div class="rounded-[2.1rem] overflow-hidden bg-black aspect-[1320/2867] relative">
						<img
							src="/screenshots/you-are-ready.png"
							alt="You Are Ready Onboarding Complete"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- FINAL CALL TO ACTION -->
		<!-- ========================================================================= -->
		<section
			class="text-center py-12 sm:py-16 px-6 bg-gradient-to-b from-[#111] to-black border-2 border-zinc-800 rounded-3xl box-3d shadow-[6px_6px_0px_0px_#22c55e] flex flex-col items-center max-w-4xl mx-auto w-full relative overflow-hidden"
		>
			<div
				class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent pointer-events-none"
			></div>

			<span class="text-green-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 block">
				Start In 30 Seconds
			</span>

			<h2 class="text-3xl sm:text-5xl font-display text-white tracking-wide mb-4">
				Ready to Master Your Money?
			</h2>

			<p class="text-zinc-400 text-base sm:text-lg mb-8 max-w-lg">
				Your financial vault is waiting. Give every rupee a purpose and experience total peace of mind.
			</p>

			<div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
				<a
					href="/login?mode=signup"
					class="w-full sm:w-auto inline-flex bg-white hover:bg-zinc-200 text-black font-bold py-4 px-8 sm:px-10 text-base sm:text-lg rounded-full box-3d transition-all active:scale-95 items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#22c55e]"
				>
					Create Your Free Vault <ChevronRight class="w-5 h-5 text-black" />
				</a>

				<a
					href="/login"
					class="w-full sm:w-auto inline-flex bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold py-4 px-8 text-base rounded-full border border-zinc-700 box-3d transition-all active:scale-95 items-center justify-center"
				>
					Log In to Vault
				</a>
			</div>
		</section>
	</main>

	<!-- Footer -->
	<div class="w-full max-w-6xl mx-auto px-6 sm:px-8 md:px-10">
		<Footer />
	</div>
</div>
