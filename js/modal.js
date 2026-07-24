import { apiClient } from "./apiClient.js";
import { showErrorNotification, showSuccessNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled]):not([type='hidden'])",
	"textarea:not([disabled])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex='-1'])",
].join(",");

const modalRefs = document.querySelectorAll("[data-modal]");

const productModalRef = document.getElementById("product-modal");
const productImageRef = document.getElementById("product-modal-image");
const productTitleRef = document.getElementById("product-modal-title");
const productPriceRef = document.getElementById("product-modal-price");
const productTextRef = document.getElementById("product-modal-text");

const orderModalRef = document.getElementById("order-modal");
const orderFormRef = document.getElementById("order-form");

let lastFocusedElement = null;
let activeModal = null;

let selectedBouquetId = null;
let selectedQuantity = 1;

function getFocusable(modalRef) {
	return Array.from(modalRef.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
		(el) => !el.hasAttribute("hidden") && el.offsetParent !== null
	);
}

function trapFocus(event) {
	if (!activeModal || event.key !== "Tab") return;

	const focusable = getFocusable(activeModal);
	if (focusable.length === 0) return;

	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}

function onKeyDown(event) {
	if (event.key === "Escape") {
		closeModal();
		return;
	}
	trapFocus(event);
}

function openModal(modalRef, trigger) {
	if (!modalRef) return;

	if (activeModal && activeModal !== modalRef) {
		closeModal({ keepBodyLock: true });
	}

	if (trigger) {
		lastFocusedElement = trigger;
	} else if (!lastFocusedElement) {
		lastFocusedElement = document.activeElement;
	}

	activeModal = modalRef;
	modalRef.removeAttribute("hidden");

	void modalRef.offsetWidth;
	modalRef.classList.add("is-open");

	document.body.classList.add("modal-open");
	document.addEventListener("keydown", onKeyDown);

	const focusable = getFocusable(modalRef);
	const target = focusable.find((el) => !el.matches("[data-modal-close]")) || focusable[0];
	if (target) {
		target.focus({ preventScroll: true });
	}
}

function closeModal(options = {}) {
	if (!activeModal) return;

	const closing = activeModal;
	closing.classList.remove("is-open");
	closing.setAttribute("hidden", "");

	activeModal = null;

	if (!options.keepBodyLock) {
		document.body.classList.remove("modal-open");
		document.removeEventListener("keydown", onKeyDown);

		if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
			lastFocusedElement.focus({ preventScroll: true });
		}
		lastFocusedElement = null;
	}
}

function fillProductModal(card) {
	const title = card.querySelector(".product-card-title")?.textContent?.trim() ?? "";
	const price = card.querySelector(".product-card-price")?.textContent?.trim() ?? "";
	const image = card.querySelector("img");

	selectedBouquetId = card.dataset.bouquetId ? Number(card.dataset.bouquetId) : null;

	productTitleRef.textContent = title;
	productPriceRef.textContent = price;

	// Картки, отримані з API, зберігають повний опис у атрибуті
	// data-desc-long. Модальне окно використовує його за наявності,
	// інакше бере короткий опис із картки, а якщо його також немає — використовує текст із макета Figma
	// для жорстко заданого резервного вмісту
	const longDesc = card.dataset?.descLong;
	const shortDesc = card.querySelector(".product-card-text")?.textContent?.trim() ?? "";
	productTextRef.textContent =
		longDesc ||
		shortDesc ||
		"Each stem is carefully selected to create a bouquet that radiates freshness, elegance, and the gentle charm of spring. Whether you're celebrating a birthday, sending love, or simply brightening someone's day, this arrangement is sure to bring warm smiles and lasting impressions.";

	if (!image) return;

	productImageRef.alt = image.getAttribute("alt") || title;

	const src1x = image.getAttribute("src") || "";
	const cardSrcset = image.getAttribute("srcset") || "";
	const m2x = cardSrcset.match(/(\S+)\s+2x/);
	const src2x = m2x ? m2x[1] : "";
	const w1 = image.naturalWidth;

	if (src1x && src2x && w1 > 0) {
		productImageRef.sizes = "(min-width: 1440px) 536px, (min-width: 768px) 308px, 295px";
		productImageRef.srcset = `${src1x} ${w1}w, ${src2x} ${w1 * 2}w`;
		productImageRef.src = src1x;
	} else {
		productImageRef.removeAttribute("sizes");
		productImageRef.srcset = cardSrcset;
		productImageRef.src = src1x;
	}
}

const quantityRef = document.getElementById("product-modal-quantity");
const quantityErrorRef = document.getElementById("product-modal-quantity-error");

function isQuantityValid() {
	if (!quantityRef) return true;
	const value = Number.parseInt(quantityRef.value, 10);
	return Number.isFinite(value) && value > 0;
}

function markQuantityError(message) {
	if (!quantityRef) return;
	quantityRef.classList.add("is-error");
	if (quantityErrorRef) {
		quantityErrorRef.textContent = message;
		quantityErrorRef.hidden = false;
	}
}

function clearQuantityError() {
	if (!quantityRef) return;
	quantityRef.classList.remove("is-error");
	if (quantityErrorRef) {
		quantityErrorRef.hidden = true;
	}
}

if (quantityRef) {
	quantityRef.addEventListener("input", () => {
		if (quantityRef.classList.contains("is-error")) {
			clearQuantityError();
		}
	});
}

document.addEventListener("click", (event) => {
	const productTrigger = event.target.closest("[data-product-trigger]");
	if (productTrigger) {
		fillProductModal(productTrigger);

		clearQuantityError();
		if (quantityRef) quantityRef.value = "";
		openModal(productModalRef, productTrigger);
		return;
	}

	const openTrigger = event.target.closest("[data-open-modal]");
	if (openTrigger) {
		const isBuyNow = openTrigger.classList.contains("product-modal-buy");
		if (isBuyNow && !isQuantityValid()) {
			const message = quantityRef.value.trim() ? "Quantity must be greater than 0" : "Please enter a quantity";
			markQuantityError(message);
			quantityRef.focus();
			return;
		}
		const targetId = openTrigger.getAttribute("data-open-modal");
		if (isBuyNow) {
			selectedQuantity = Number.parseInt(quantityRef?.value, 10) || 1;
		} else if (targetId === "order-modal") {
			selectedBouquetId = null;
			selectedQuantity = 1;
		}
		const targetRef = document.getElementById(targetId);
		openModal(targetRef, openTrigger);
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key !== "Enter" && event.key !== " ") return;
	const productTrigger = event.target.closest?.("[data-product-trigger]");
	if (!productTrigger || event.target !== productTrigger) return;
	event.preventDefault();
	fillProductModal(productTrigger);
	openModal(productModalRef, productTrigger);
});

modalRefs.forEach((modalRef) => {
	modalRef.addEventListener("click", (event) => {
		if (event.target === modalRef) {
			closeModal();
		}
	});

	modalRef.querySelectorAll("[data-modal-close]").forEach((btn) => {
		btn.addEventListener("click", () => {
			closeModal();
		});
	});
});

function getFieldError(field) {
	return document.getElementById(`${field.id}-error`);
}

function setFieldError(field, message) {
	field.classList.add("is-error");
	const errorEl = getFieldError(field);
	if (errorEl) {
		errorEl.textContent = message;
		errorEl.hidden = false;
	}
}

function clearFieldError(field) {
	field.classList.remove("is-error");
	const errorEl = getFieldError(field);
	if (errorEl) {
		errorEl.hidden = true;
	}
}

function validateField(field) {
	const value = field.value.trim();

	if (field.required && !value) {
		setFieldError(field, "This field is required");
		return false;
	}

	if (field.type === "tel" && value) {
		// Accept digits, spaces, +, -, parentheses; require at least 7 digits.
		const digits = value.replace(/\D/g, "");
		if (digits.length < 7) {
			setFieldError(field, "Please enter a valid phone number");
			return false;
		}
	}

	clearFieldError(field);
	return true;
}

if (orderFormRef) {
	const validatable = orderFormRef.querySelectorAll(".modal-field-input, .modal-field-textarea");

	validatable.forEach((field) => {
		field.addEventListener("input", () => {
			if (field.classList.contains("is-error")) {
				clearFieldError(field);
			}
		});
	});

	let isSubmitting = false;
	const submitButton = orderFormRef.querySelector("button[type='submit']");

	orderFormRef.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (isSubmitting) return;

		let firstInvalid = null;
		validatable.forEach((field) => {
			const ok = validateField(field);
			if (!ok && !firstInvalid) {
				firstInvalid = field;
			}
		});

		if (firstInvalid) {
			firstInvalid.focus();
			return;
		}

		const formData = new FormData(orderFormRef);
		const data = Object.fromEntries(formData.entries());
		const payload = {
			name: (data.name || "").toString().trim(),
			phone: (data.phone || "").toString().trim(),
			address: (data.address || "").toString().trim(),
			message: (data.message || "").toString().trim(),
			quantity: selectedQuantity,
			bouquetId: selectedBouquetId,
		};

		isSubmitting = true;
		const defaultLabel = submitButton?.textContent;
		if (submitButton) {
			submitButton.disabled = true;
			submitButton.classList.add("is-loading");
			submitButton.textContent = "Sending...";
		}

		try {
			await apiClient.post("/orders", payload);
			showSuccessNotification(`Thank you, ${payload.name}! We'll call you at ${payload.phone} shortly.`);
			orderFormRef.reset();
			validatable.forEach((field) => clearFieldError(field));
			closeModal();
		} catch (error) {
			showErrorNotification(extractErrorMessage(error, "Could not place your order. Please try again."));
		} finally {
			isSubmitting = false;
			if (submitButton) {
				submitButton.disabled = false;
				submitButton.classList.remove("is-loading");
				submitButton.textContent = defaultLabel;
			}
		}
	});
}
