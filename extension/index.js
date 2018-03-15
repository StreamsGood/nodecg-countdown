const moment = require('moment');

const formatTime = duration => {
	const utc = moment.utc(moment.duration(duration).asMilliseconds());
	return utc.format('HH:mm:ss');
};

const formatDisplayTime = duration => {
	const utc = moment.utc(moment.duration(duration).asMilliseconds());
	if (utc.hours() > 0) {
		return utc.format('HH:mm:ss');
	}

	return utc.format('mm:ss');
};

module.exports = nodecg => {
	const countdown = nodecg.Replicant('countdown', {
		defaultValue: '00:50:00',
		persistent: false
	});

	const countdownDisplay = nodecg.Replicant('countdown-display', {
		defaultValue: '50:00',
		persistent: false
	});

	const running = nodecg.Replicant('running', {
		defaultValue: false,
		persistent: false
	});

	let tickInterval;
	let targetMoment;

	const updateDisplayValue = () => {
		countdownDisplay.value = formatDisplayTime(countdown.value);
	};

	const setValue = timeString => {
		if (!running.value && moment.duration(timeString).isValid()) {
			countdown.value = formatTime(timeString);
			updateDisplayValue();
		}
	};

	const tryTick = () => {
		const diff = targetMoment.diff(moment());

		if (diff <= 0) {
			countdown.value = formatTime('00:00:00');
			running.value = false;
		} else {
			countdown.value = formatTime(moment.duration(diff));
		}

		updateDisplayValue();
	};

	running.on('change', newValue => {
		if (newValue === true) {
			targetMoment = moment().add(moment.duration(countdown.value));
			tickInterval = setInterval(tryTick, 500);
		} else {
			clearInterval(tickInterval);
		}
	});

	nodecg.listenFor('set', setValue);

	nodecg.listenFor('setAndStart', timeString => {
		setValue(timeString);
		running.value = true;
	});
};
