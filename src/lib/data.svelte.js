import { supabase } from '$lib/supabase';
import { cryptoStore } from '$lib/cryptoStore.svelte';
import { decryptData } from '$lib/crypto';

/**
 * @description Normalizes date strings to Date objects, preventing UTC/local timezone shifts.
 * @param {string | Date} dateStr
 * @returns {Date}
 */
export function parseDate(dateStr) {
	if (!dateStr) return new Date();
	if (dateStr instanceof Date) return dateStr;
	if (typeof dateStr === 'string' && dateStr.includes('T')) {
		return new Date(dateStr);
	}
	if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
		const [y, m, d] = dateStr.split('-').map(Number);
		return new Date(y, m - 1, d, 0, 0, 0, 0);
	}
	return new Date(dateStr);
}

/**
 * @class DataStore
 * @description Centralized state management for the Expense Tracker. Uses Svelte 5 runes for reactivity.
 * Responsible for fetching budgets, transactions, and calculating aggregate values for the dashboard.
 */
class DataStore {
	loading = $state(true);

	/** @type {any[]} List of variable budgets */
	budgets = $state([]);

	/** @type {Record<string, number>} Total spent (debits) per category in the current period */
	categoryTotals = $state({});

	/** @type {Record<string, number>} Total credited per category in the current period */
	categoryCredits = $state({});

	/** @type {Record<string, number>} Effective limit per category (limit + credits) */
	categoryEffectiveLimit = $state({});

	/** @type {Record<string, number>} Amount left per category */
	categoryLeft = $state({});

	/** @type {any[]} List of corpus (savings) budgets */
	corpusBudgets = $state([]);

	/** @type {any[]} List of fixed budgets */
	fixedBudgets = $state([]);

	/** @type {Set<string>} Unique categories with transactions in current period */
	transactionCategories = $state(new Set());

	/** @type {any[]} List of all transactions for the current period */
	currentPeriodTransactions = $state([]);

	/** @type {any[]} List of all transactions all time */
	allTransactions = $state([]);

	/** @type {number} Left amount in corpus / unallocated liquid balance */
	globalLiquidBalance = $state(0);

	/** @type {number} Alias for globalLiquidBalance */
	corpusLeft = $state(0);

	/** @type {number} Amount debited from personal corpus this period */
	currentPeriodCorpusUsed = $state(0);

	/** @type {number} Amount credited to personal corpus this period */
	currentPeriodCorpusCredits = $state(0);

	/** @type {number} Net total account balance all time */
	totalAccountBalance = $state(0);

	/** @type {number} Total locked limit for corpus budgets */
	corpusLimit = $state(0);

	/** @type {string} Authenticated user's display name */
	userName = $state('User');

	/** @type {string | null} Authenticated user's ID */
	userId = $state(null);

	/**
	 * @description Derived total variable expenses used in the current period.
	 * Calculated by summing the positive net spent for all variable budgets.
	 */
	totalVariableUsed = $derived(
		this.budgets.reduce((sum, b) => sum + Math.max(0, this.categoryTotals[b.id] || 0), 0)
	);

	/**
	 * @description Derived total limit for all variable expenses combined.
	 */
	totalVariableLimit = $derived(
		this.budgets.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0)
	);

	/**
	 * @description Derived dynamic text providing insights based on the current spending pace.
	 */
	insightLine = $derived.by(() => {
		if (this.loading) return 'Fetching your insights...';
		if (this.totalVariableLimit > 0) {
			const usedPercentage = (this.totalVariableUsed / this.totalVariableLimit) * 100;
			if (usedPercentage > 90) return "You're spending too fast!";
			if (usedPercentage > 75) return 'Watch out, budget is getting tight.';
			if (usedPercentage > 50) return 'Halfway through your budget.';
			return 'Looking good this period!';
		}
		return 'Welcome to your financial hub.';
	});

	/**
	 * @description Fetches all required dashboard data asynchronously in parallel.
	 * @param {boolean} background If true, skips setting loading state to prevent UI flashes.
	 */
	async loadData(background = false) {
		if (!background) this.loading = true;

		if (!cryptoStore.dmk) {
			console.warn('DMK not available. Cannot decrypt data.');
			this.loading = false;
			return;
		}

		// Fetch user profile securely
		const fetchProfile = async () => {
			if (this.userId) return this.userId;
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData?.session?.user) {
				const id = sessionData.session.user.id;
				this.userId = id;
				const { data: profile } = await supabase
					.from('profiles')
					.select('first_name')
					.eq('id', id)
					.single();

				if (profile?.first_name) {
					this.userName = profile.first_name;
				} else if (sessionData.session.user.user_metadata?.first_name) {
					this.userName = sessionData.session.user.user_metadata.first_name;
				} else if (sessionData.session.user.email) {
					this.userName = sessionData.session.user.email.split('@')[0];
				}
				return id;
			}
			return null;
		};

		const userId = await fetchProfile();
		if (!userId) {
			this.loading = false;
			return;
		}

		// Execute all Supabase queries concurrently against ENCRYPTED tables
		const [budgetRes, allHistoryRes] = await Promise.all([
			supabase.from('budgets_encrypted').select('*').eq('user_id', userId),
			supabase.from('transactions_encrypted').select('*').eq('user_id', userId)
		]);

		const rawBudgets = budgetRes.data || [];
		const rawTransactions = allHistoryRes.data || [];

		// Decrypt all budgets concurrently
		const budgetPromises = rawBudgets.map(async (row) => {
			try {
				const plaintext = await decryptData(
					row.encrypted_data,
					/** @type {CryptoKey} */ (cryptoStore.dmk)
				);
				const data = JSON.parse(plaintext);
				return { ...data, category_id: row.category_id };
			} catch (err) {
				console.error('Failed to decrypt budget', row.category_id, err);
				return null;
			}
		});

		// Decrypt all transactions concurrently
		const transactionPromises = rawTransactions.map(async (row) => {
			try {
				const plaintext = await decryptData(
					row.encrypted_data,
					/** @type {CryptoKey} */ (cryptoStore.dmk)
				);
				const data = JSON.parse(plaintext);
				return { ...data, id: row.id, user_id: row.user_id };
			} catch (err) {
				console.error('Failed to decrypt transaction', row.id, err);
				return null;
			}
		});

		const budgetData = (await Promise.all(budgetPromises)).filter(Boolean);
		budgetData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

		const allHistory = (await Promise.all(transactionPromises)).filter(Boolean);
		this.allTransactions = allHistory;

		// 1. Process Budget metadata and calculate start dates
		let totalLimitsAll = 0;
		let currentCorpusLimit = 0;
		/** @type {Record<string, string>} */
		const categoryIdMap = {};

		budgetData.forEach((b) => {
			if (b.category_id) categoryIdMap[b.category_id] = b.category;
			const limit = Number(b.limit_amount || 0);
			if (limit !== -1) {
				totalLimitsAll += limit;
				if (b.budget_type === 'corpus') {
					currentCorpusLimit += limit;
				}
			}
		});
		this.corpusLimit = currentCorpusLimit;

		// --- DATE MATH: Calculate current period start for each category ---
		const today = new Date();
		const todayYear = today.getFullYear();
		const todayMonth = today.getMonth();
		const todayDate = today.getDate();
		const todayDayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
		const todayMidnight = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);

		budgetData.forEach((b) => {
			let calcStart = null;

			if (b.period_type === 'monthly') {
				const resetDate = parseInt(b.reset_date) || 1;
				if (todayDate < resetDate) {
					calcStart = new Date(todayYear, todayMonth - 1, resetDate, 0, 0, 0, 0);
				} else {
					calcStart = new Date(todayYear, todayMonth, resetDate, 0, 0, 0, 0);
				}
			} else if (b.period_type === 'weekly') {
				const resetDate = parseInt(b.reset_date) || 0;
				let diff = todayDayOfWeek - resetDate;
				if (diff < 0) diff += 7;
				calcStart = new Date(todayYear, todayMonth, todayDate - diff, 0, 0, 0, 0);
			} else if (b.period_type === 'yearly') {
				const resetDate = parseInt(b.reset_date) || 1;
				const startOfYear = new Date(todayYear, 0, 1, 0, 0, 0, 0);
				const currentDOY =
					Math.floor((todayMidnight.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

				if (currentDOY < resetDate) {
					calcStart = new Date(todayYear - 1, 0, 1, 0, 0, 0, 0);
					calcStart.setDate(calcStart.getDate() + resetDate - 1);
				} else {
					calcStart = new Date(todayYear, 0, 1, 0, 0, 0, 0);
					calcStart.setDate(calcStart.getDate() + resetDate - 1);
				}
			} else if (b.period_type === 'daily') {
				calcStart = todayMidnight;
			} else if (b.period_type === 'manual') {
				calcStart = b.last_manual_reset ? new Date(b.last_manual_reset) : null;
			}

			b.current_period_start = calcStart;
		});

		// 2. Process Transactions (Current Period vs Old Transactions)
		/** @type {Record<string, number>} Net current-period debits minus credits per category */
		const categoryNetSpent = {};
		const transactionCats = new Set();
		let totalBalance = 0;
		let oldTransactionsSum = 0;
		let currentPeriodCorpusDebits = 0;
		let currentPeriodCorpusCredits = 0;

		allHistory.forEach((tx) => {
			const txDate = parseDate(tx.transaction_date || tx.created_at);
			const catName = categoryIdMap[tx.category_id] || tx.category || 'Unknown';
			const catId = tx.category_id || 'unknown';
			const amount = Number(tx.amount || 0);
			tx.category = catName;

			totalBalance += amount;

			const b = budgetData.find((item) => item.category_id === tx.category_id);

			let isCurrentPeriod = false;
			if (b && Number(b.limit_amount || 0) !== -1 && b.current_period_start) {
				if (b.period_type === 'manual') {
					const compDate = tx.created_at ? new Date(tx.created_at) : txDate;
					if (compDate >= b.current_period_start) {
						isCurrentPeriod = true;
					}
				} else {
					if (txDate >= b.current_period_start) {
						isCurrentPeriod = true;
					}
				}
			}

			if (isCurrentPeriod) {
				transactionCats.add(catId);
				// amount is negative for debit, positive for credit
				// net spent = debits - credits = -amount
				categoryNetSpent[catId] = (categoryNetSpent[catId] || 0) - amount;

				if (b.budget_type === 'corpus') {
					if (amount < 0) {
						currentPeriodCorpusDebits += Math.abs(amount);
					} else {
						currentPeriodCorpusCredits += amount;
					}
				}
			} else {
				// Old transaction
				oldTransactionsSum += amount;
			}
		});

		// 3. Compute per-category Used, Left, and Extra
		/** @type {Record<string, number>} */
		const categoryUsed = {};
		/** @type {Record<string, number>} */
		const categoryLeft = {};
		/** @type {Record<string, number>} */
		const categoryExtra = {};

		budgetData.forEach((b) => {
			const catId = b.category_id || b.category;
			const baseLimit = Number(b.limit_amount || 0);
			const netSpent = categoryNetSpent[b.category_id] || 0;

			categoryUsed[catId] = netSpent;

			if (netSpent < 0) {
				// Credits exceeded debits
				categoryLeft[catId] = baseLimit; // Clamped to limit
				categoryExtra[catId] = Math.abs(netSpent);
			} else {
				categoryLeft[catId] = Math.max(0, baseLimit - netSpent);
				categoryExtra[catId] = 0;
			}

			b.used = netSpent;
			b.left = categoryLeft[catId];
			b.extra = categoryExtra[catId];
		});

		// 4. Calculate Corpus Left at Reset and Current Left
		const leftAtReset = oldTransactionsSum - totalLimitsAll;
		const corpusBudgetObj = budgetData.find((b) => b.budget_type === 'corpus');
		const corpusCatId = corpusBudgetObj ? corpusBudgetObj.category_id : null;
		const corpusNetSpent = corpusCatId ? categoryNetSpent[corpusCatId] || 0 : 0;

		let calculatedCorpusLeft = 0;
		let corpusExtra = 0;
		if (corpusNetSpent < 0) {
			calculatedCorpusLeft = leftAtReset; // Clamped to left_at_reset
			corpusExtra = Math.abs(corpusNetSpent);
		} else {
			calculatedCorpusLeft = leftAtReset - corpusNetSpent;
			corpusExtra = 0;
		}

		this.categoryTotals = categoryUsed;
		this.categoryCredits = {};
		this.categoryEffectiveLimit = {};
		this.categoryLeft = categoryLeft;
		this.categoryExtra = categoryExtra;
		this.transactionCategories = transactionCats;
		this.currentPeriodTransactions = [];

		this.budgets = budgetData
			.filter((b) => b.budget_type === 'variable' && Number(b.limit_amount || 0) !== -1)
			.map((b) => ({
				...b,
				id: b.category_id || b.category
			}));

		this.corpusBudgets = budgetData
			.filter((b) => b.budget_type === 'corpus' && Number(b.limit_amount || 0) !== -1)
			.map((b) => ({
				...b,
				id: b.category_id || b.category
			}));

		this.fixedBudgets = budgetData
			.filter((b) => b.budget_type === 'fixed' && Number(b.limit_amount || 0) !== -1)
			.map((b) => ({
				...b,
				id: b.category_id || b.category
			}));

		this.leftAtReset = leftAtReset;
		this.globalLiquidBalance = calculatedCorpusLeft;
		this.corpusLeft = calculatedCorpusLeft;
		this.corpusExtra = corpusExtra;
		this.currentPeriodCorpusUsed = corpusNetSpent;
		this.currentPeriodCorpusDebits = currentPeriodCorpusDebits;
		this.currentPeriodCorpusCredits = currentPeriodCorpusCredits;
		this.totalAccountBalance = totalBalance;

		this.loading = false;
	}
}

export const appData = new DataStore();
