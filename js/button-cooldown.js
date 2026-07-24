const COOLDOWN_MS = 125;

function applyCooldown(target) {
	queueMicrotask(() => {
		if (typeof target.blur === "function") {
			target.blur();
		}
		target.classList.add("click-cooldown");

		window.setTimeout(() => {
			target.classList.remove("click-cooldown");
		}, COOLDOWN_MS);
	});
}

document.addEventListener("click", (event) => {
	const target = event.target.closest(".primary-button, .slider-nav-button");
	if (target) {
		applyCooldown(target);
	}
});
