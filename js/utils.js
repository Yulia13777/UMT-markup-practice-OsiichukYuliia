export function extractErrorMessage(error, fallbackMessage = "Something went wrong. Please try again later.") {
	const serverMessage = error.response?.data?.message ?? error.response?.data?.error;
	if (typeof serverMessage === "string" && serverMessage.length > 0) {
		return serverMessage;
	}
	if (error.message) {
		return error.message;
	}
	return fallbackMessage;
}

export function formatPriceUsd(priceValue) {
	if (priceValue === null || priceValue === undefined || priceValue === "") {
		return "—";
	}
	const numericValue =
		typeof priceValue === "number"
			? priceValue
			: Number.parseFloat(
					String(priceValue)
						.replace(/[^0-9.,-]/g, "")
						.replace(",", ".")
				);
	if (Number.isNaN(numericValue)) {
		return String(priceValue);
	}
	return `$${numericValue}`;
}

const BASE = import.meta.env.BASE_URL || "/";

export function resolveImageUrl(rawPath) {
	if (!rawPath || typeof rawPath !== "string") {
		return "";
	}
	if (/^(https?:)?\/\//i.test(rawPath) || rawPath.startsWith("data:")) {
		return rawPath;
	}
	const cleaned = rawPath.replace(/^\.?\/+/, "");
	return BASE + cleaned;
}

export function suppressHoverUntilLeave(button) {
	if (!button) return;
	button.blur();
}
