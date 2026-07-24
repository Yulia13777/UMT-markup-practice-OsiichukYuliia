import axios from "axios";

const isStaticMode = import.meta.env.VITE_API_MODE === "static";

function resolveApiBaseURL() {
	const raw = import.meta.env.VITE_API_BASE_URL ?? "api";
	if (/^https?:\/\//i.test(raw)) {
		return raw;
	}
	const segment = raw.replace(/^\/+|\/+$/g, "");
	const siteBase = new URL(import.meta.env.BASE_URL, "http://vite.local");
	return new URL(segment, siteBase).pathname;
}

export const apiClient = axios.create({
	baseURL: resolveApiBaseURL(),
	timeout: 15_000,
});

if (isStaticMode) {
	// GitHub Pages не може запускати json-server. Під час збірки Vite
	// для кожної колекції створюється окремий статичний JSON-файл
	// (dist/api/<name>.json), тому ми змінюємо URL вихідних запитів
	// з `/products` на `/products.json`. Параметри рядка запиту
	// синтаксично зберігаються, але статичний хост їх ігнорує.
	// Якщо в майбутньому знадобляться фільтрація або пагінація на
	// GitHub Pages, їх потрібно буде реалізовувати на стороні клієнта.
	apiClient.interceptors.request.use((config) => {
		if (typeof config.url !== "string" || config.url.length === 0) {
			return config;
		}
		const [pathPart, queryPart] = config.url.split("?", 2);
		if (!pathPart || /\.[a-z0-9]+$/i.test(pathPart)) {
			return config;
		}
		config.url = queryPart ? `${pathPart}.json?${queryPart}` : `${pathPart}.json`;
		return config;
	});
}
