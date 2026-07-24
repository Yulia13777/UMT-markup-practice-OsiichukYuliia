import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage, formatPriceUsd, resolveImageUrl, suppressHoverUntilLeave } from "./utils.js";

const itemsPerPage = 8;
const showMoreButtonDefaultLabel = "Show More";
const showMoreButtonLoadingLabel = "Loading...";

const bouquetsList = document.getElementById("bouquets-list");
const bouquetsListShell = document.querySelector(".bouquets-list-shell");
const bouquetsLoader = document.getElementById("bouquets-loader");
const showMoreButton = document.querySelector(".bouquets-show-more-button");
const endMessage = document.querySelector(".bouquets-end-message");

const state = {
	currentPage: 0,
	perPage: itemsPerPage,
	hasMore: true,

	staticCache: null,
};

function buildBouquetsListItemShellMarkup() {
	return `
		<li class="bouquets-item">
			<article class="product-card" tabindex="0" role="button" data-product-trigger>
				<img loading="lazy" class="bouquets-card-image" alt="">
				<div class="product-card-content">
					<div class="product-card-header">
						<h3 class="product-card-title"></h3>
						<p class="product-card-text"></p>
					</div>
					<p class="product-card-price"></p>
				</div>
			</article>
		</li>`;
}

function fillBouquetsListItem(listItem, product) {
	const image = listItem.querySelector(".bouquets-card-image");
	const photo2x = resolveImageUrl(product.photoURL2x);
	if (photo2x) {
		image.setAttribute("srcset", `${photo2x} 2x`);
	}
	image.src = resolveImageUrl(product.photoURL);
	image.alt = product.alt ?? product.title ?? "";

	listItem.querySelector(".product-card-title").textContent = product.title ?? "";
	listItem.querySelector(".product-card-text").textContent = product.description ?? "";
	listItem.querySelector(".product-card-price").textContent = formatPriceUsd(product.price);

	const card = listItem.querySelector(".product-card");
	if (product.id != null) {
		card.dataset.bouquetId = String(product.id);
	}
	if (product.descriptionLong) {
		card.dataset.descLong = product.descriptionLong;
	}
}

function setShowMoreButtonLoading(isLoading) {
	if (!showMoreButton) return;
	showMoreButton.disabled = isLoading;
	showMoreButton.classList.toggle("is-loading", isLoading);
	showMoreButton.textContent = isLoading ? showMoreButtonLoadingLabel : showMoreButtonDefaultLabel;
}

function setBouquetsInitialLoading(isLoading) {
	if (bouquetsLoader) bouquetsLoader.hidden = !isLoading;
	if (bouquetsListShell) bouquetsListShell.setAttribute("aria-busy", isLoading ? "true" : "false");
}

function updateEndState() {
	if (showMoreButton) showMoreButton.hidden = !state.hasMore;
	if (endMessage) endMessage.hidden = state.hasMore || state.currentPage === 0;
}

function appendChunk(items) {
	if (!items.length) return;
	const beforeCount = bouquetsList.children.length;
	const chunkMarkup = items.map(() => buildBouquetsListItemShellMarkup()).join("");
	bouquetsList.insertAdjacentHTML("beforeend", chunkMarkup);
	const listItems = bouquetsList.querySelectorAll(":scope > .bouquets-item");
	for (let i = 0; i < items.length; i += 1) {
		fillBouquetsListItem(listItems[beforeCount + i], items[i]);
	}
}

// Отримуємо одну сторінку даних. Спочатку намагаємося використати
// серверну пагінацію (у json-server v1 повертається об'єкт
// { items, next, ... }). Якщо хост проігнорував параметри запиту
// (як у статичному розгортанні на GitHub Pages), використовуємо
// резервний варіант: кешуємо весь масив і розбиваємо його на
// сторінки локально.
async function fetchPage(page) {
	if (state.staticCache) {
		const start = (page - 1) * state.perPage;
		const slice = state.staticCache.slice(start, start + state.perPage);
		state.hasMore = start + state.perPage < state.staticCache.length;
		return slice;
	}

	const response = await apiClient.get("/bouquets", {
		params: { page, perPage: state.perPage },
	});
	const data = response.data;

	if (data && Array.isArray(data.data)) {
		state.hasMore = data.meta?.hasNextPage === true;
		return data.data;
	}

	if (Array.isArray(data)) {
		state.staticCache = data;
		const start = (page - 1) * state.perPage;
		const slice = data.slice(start, start + state.perPage);
		state.hasMore = start + state.perPage < data.length;
		return slice;
	}

	state.hasMore = false;
	return [];
}

async function loadNextPage() {
	const targetPage = state.currentPage + 1;
	const items = await fetchPage(targetPage);
	if (items.length > 0) {
		appendChunk(items);
		state.currentPage = targetPage;
	} else {
		state.hasMore = false;
	}
}

async function loadInitial() {
	if (!bouquetsList) return;

	setBouquetsInitialLoading(true);
	bouquetsList.replaceChildren();
	state.currentPage = 0;
	state.hasMore = true;
	state.staticCache = null;
	if (showMoreButton) showMoreButton.hidden = true;
	if (endMessage) endMessage.hidden = true;

	try {
		await loadNextPage();
	} catch (error) {
		showErrorNotification(extractErrorMessage(error, "Unable to load bouquets right now."));
	} finally {
		setBouquetsInitialLoading(false);
		updateEndState();
	}
}

async function handleShowMoreClick() {
	if (!state.hasMore) return;
	setShowMoreButtonLoading(true);
	try {
		await loadNextPage();
	} catch (error) {
		showErrorNotification(extractErrorMessage(error, "Unable to load more bouquets right now."));
	} finally {
		setShowMoreButtonLoading(false);
		updateEndState();
		suppressHoverUntilLeave(showMoreButton);
	}
}

function initBouquetsFromApi() {
	if (!bouquetsList || !showMoreButton) return;
	showMoreButton.addEventListener("click", handleShowMoreClick);
	loadInitial();
}

initBouquetsFromApi();
