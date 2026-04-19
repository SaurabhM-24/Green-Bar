class State {
	month = $state(new Date().getMonth() + 1);
	year = $state(new Date().getFullYear());

	get monthName() {
		return new Date(this.year, this.month - 1).toLocaleString('default', { month: 'long' });
	}

	prevMonth() {
		if (this.month === 1) {
			this.month = 12;
			this.year--;
		} else {
			this.month--;
		}
	}

	nextMonth() {
		if (this.month === 12) {
			this.month = 1;
			this.year++;
		} else {
			this.month++;
		}
	}
}

export const appState = new State();
