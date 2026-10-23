const bootRhine = () => {
	"use strict";
	if (document.getElementById("dsh-rhine-overlay")) return;
	const cfg = Object.assign({
		title: "DEEPSEEK HARNESS",
		subtitle: "AI AGENT HARNESS · 智能体工作台",
		caption: "点击图标启动 · CLICK THE EMBLEM TO LAUNCH",
		watermark: "",
		minDisplayMs: 1500,
		maxDisplayMs: 3300,
		fadeMs: 450,
		autoLaunchMs: 0,
		themeEnabled: true,
		forceDark: true
	}, typeof globalThis.__DSH_BOOT_RHINE__ === "object" && globalThis.__DSH_BOOT_RHINE__ ? globalThis.__DSH_BOOT_RHINE__ : {});
	const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
	const started = performance.now();

	const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
		"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
	})[ch]);

	/* DeepSeek 官方鲸鱼图标（favicon 同款路径，50x50 视口） */
	const WHALE_PATH = "M48.8354 10.0479C48.3232 9.79199 48.1025 10.2798 47.8032 10.5278C47.7007 10.6079 47.6143 10.7119 47.5273 10.8076C46.7793 11.624 45.9048 12.1597 44.7622 12.0957C43.0923 12 41.666 12.5356 40.4058 13.8398C40.1377 12.2319 39.2476 11.272 37.8926 10.6558C37.1836 10.3359 36.4668 10.0156 35.9702 9.31982C35.6235 8.82373 35.5293 8.27197 35.356 7.72754C35.2456 7.3999 35.1353 7.06396 34.7651 7.00781C34.3633 6.94385 34.2056 7.2876 34.0479 7.57568C33.418 8.75195 33.1733 10.0479 33.1973 11.3599C33.2524 14.312 34.4736 16.6641 36.8999 18.3359C37.1758 18.5278 37.2466 18.7197 37.1597 19C36.9946 19.5757 36.7974 20.1357 36.624 20.7119C36.5137 21.0801 36.3486 21.1597 35.9624 21C34.6309 20.4321 33.481 19.5918 32.4644 18.5757C30.7393 16.8721 29.1792 14.9917 27.2334 13.52C26.7764 13.1758 26.3193 12.856 25.8467 12.5518C23.8618 10.584 26.1069 8.96777 26.627 8.77588C27.1704 8.57568 26.8159 7.8877 25.0591 7.896C23.3022 7.90381 21.6953 8.50391 19.647 9.30371C19.3477 9.42383 19.0322 9.51172 18.7095 9.58398C16.8501 9.22363 14.9199 9.14355 12.9033 9.37598C9.10596 9.80762 6.07275 11.6396 3.84326 14.7681C1.16455 18.5278 0.53418 22.7998 1.30664 27.2559C2.11768 31.9521 4.46582 35.8398 8.07373 38.8799C11.8159 42.0322 16.1255 43.5762 21.041 43.2803C24.0269 43.104 27.3516 42.6963 31.1016 39.4561C32.0469 39.936 33.0396 40.1279 34.686 40.272C35.9546 40.3921 37.1758 40.208 38.1211 40.0078C39.6021 39.688 39.4995 38.2881 38.9639 38.0322C34.623 35.9678 35.5762 36.8081 34.71 36.1279C36.9155 33.4639 40.2402 30.6958 41.54 21.728C41.6426 21.0161 41.5557 20.5679 41.54 19.9917C41.5322 19.6396 41.6108 19.5039 42.0049 19.4639C43.0923 19.3359 44.1479 19.0317 45.1167 18.4878C47.9292 16.9199 49.064 14.3438 49.3315 11.2559C49.3711 10.7837 49.3237 10.2959 48.8354 10.0479ZM24.3262 37.8398C20.1196 34.4639 18.0791 33.3521 17.2358 33.3999C16.4482 33.4482 16.5898 34.3682 16.7632 34.9678C16.9443 35.5601 17.1812 35.9683 17.5117 36.4878C17.7402 36.832 17.8979 37.3442 17.2832 37.728C15.9282 38.584 13.5728 37.4399 13.4624 37.3838C10.7207 35.7358 8.42822 33.5601 6.81348 30.584C5.25342 27.7197 4.34766 24.6479 4.19775 21.3677C4.1582 20.5757 4.38672 20.2959 5.15869 20.1519C6.17529 19.96 7.22314 19.9199 8.23926 20.0718C12.5327 20.7119 16.1885 22.6719 19.2529 25.7759C21.002 27.5439 22.3252 29.6558 23.6885 31.7202C25.1377 33.9121 26.6978 36 28.6831 37.7119C29.3843 38.312 29.9434 38.7681 30.479 39.104C28.8643 39.2881 26.1699 39.3281 24.3262 37.8398ZM26.3433 24.6001C26.3433 24.248 26.6191 23.9678 26.9658 23.9678C27.0444 23.9678 27.1152 23.9839 27.1782 24.0078C27.2651 24.04 27.3438 24.0879 27.4067 24.1602C27.5171 24.272 27.5801 24.4321 27.5801 24.6001C27.5801 24.9521 27.3042 25.2319 26.9575 25.2319C26.6108 25.2319 26.3433 24.9521 26.3433 24.6001ZM32.6064 27.8799C32.2046 28.0479 31.8027 28.1919 31.4165 28.208C30.8179 28.2397 30.1641 27.9922 29.8096 27.688C29.2583 27.2158 28.8643 26.9521 28.6987 26.1279C28.6279 25.7759 28.6675 25.2319 28.7305 24.9199C28.8721 24.248 28.7144 23.8159 28.2495 23.4238C27.8716 23.104 27.3911 23.0161 26.8633 23.0161C26.666 23.0161 26.4849 22.9277 26.3511 22.856C26.1304 22.7441 25.9492 22.4639 26.1226 22.1201C26.1777 22.0078 26.4458 21.7358 26.5088 21.688C27.2256 21.272 28.0527 21.4077 28.8169 21.7197C29.5259 22.0161 30.0615 22.5601 30.834 23.3281C31.6216 24.2559 31.7632 24.5117 32.2124 25.208C32.5669 25.752 32.8901 26.312 33.1104 26.9521C33.2446 27.3521 33.0713 27.6802 32.6064 27.8799Z";

	const emblem = '<svg viewBox="0 0 240 240" role="img" aria-label="DeepSeek Harness">' +
		'<defs>' +
		'<linearGradient id="dsBlue" x1="0" y1="0" x2="1" y2="1">' +
		'<stop offset="0" stop-color="#8fb0ff"/><stop offset="0.55" stop-color="#4d6bfe"/><stop offset="1" stop-color="#3a55e0"/>' +
		'</linearGradient>' +
		'<radialGradient id="dsHalo">' +
		'<stop offset="0" stop-color="rgb(77 107 254 / 40%)"/><stop offset="1" stop-color="rgb(77 107 254 / 0%)"/>' +
		'</radialGradient>' +
		'</defs>' +
		'<circle class="rhine-halo" cx="120" cy="120" r="106" fill="url(#dsHalo)"/>' +
		'<g class="rhine-orbit">' +
		'<circle cx="120" cy="120" r="100" fill="none" stroke="rgb(126 162 255 / 30%)" stroke-width="1" stroke-dasharray="3 9"/>' +
		'</g>' +
		'<g class="rhine-orbit-dot"><circle cx="120" cy="20" r="3.2" fill="#a5c0ff"/></g>' +
		'<circle class="rhine-tile" cx="120" cy="120" r="68" pathLength="100" fill="rgb(77 107 254 / 9%)" stroke="rgb(126 162 255 / 50%)" stroke-width="1.5"/>' +
		'<g class="rhine-whale"><path d="' + WHALE_PATH + '" transform="translate(60 60) scale(2.4)" fill="url(#dsBlue)"/></g>' +
		'</svg>';

	const letters = String(cfg.title || "").split("").map((ch, index) => {
		if (ch === " ") return '<span class="rhine-space"></span>';
		return `<span class="rhine-l" style="animation-delay:${(0.5 + index * 0.05).toFixed(3)}s">${escapeHtml(ch)}</span>`;
	}).join("");

	const overlay = document.createElement("div");
	overlay.id = "dsh-rhine-overlay";
	const watermark = cfg.watermark ? `<div class="rhine-watermark">${escapeHtml(cfg.watermark)}</div>` : "";
	overlay.innerHTML = '<div class="rhine-scan"></div>' +
		'<div class="rhine-corner tl"></div><div class="rhine-corner tr"></div>' +
		'<div class="rhine-corner bl"></div><div class="rhine-corner br"></div>' +
		'<div class="rhine-tag">DEEPSEEK HARNESS // WEB GUI</div>' +
		'<div class="rhine-build">BOOT · CUSTOM</div>' +
		watermark +
		'<div class="rhine-stage">' +
		`<div class="rhine-emblem" role="button" tabindex="0" aria-label="启动 DeepSeek Harness">${emblem}</div>` +
		`<div class="rhine-word">${letters}</div>` +
		`<div class="rhine-sub">${escapeHtml(cfg.subtitle)}</div>` +
		`<div class="rhine-caption">${escapeHtml(cfg.caption)}</div>` +
		'<div class="rhine-progress">' +
		'<div class="rhine-track"><div class="rhine-bar"></div></div>' +
		'<div class="rhine-pct">000%</div>' +
		'</div>' +
		'<div class="rhine-status">ESTABLISHING SECURE SESSION</div>' +
		'</div>';
	(document.body || document.documentElement).appendChild(overlay);

	/* 深色主题默认生效：除非用户明确选择"浅色"或 forceDark 关闭，否则把
	   页面调色板固定在深色（主题 CSS 只在 body[data-ds-dark-theme] 下生效）。
	   仅影响本次会话，不在设置里写入任何内容。脚本可能在 <head> 阶段执行
	   （body 尚未创建），因此对 body 判空，并在 DOMContentLoaded 后再断言一次。 */
	const applyDarkPalette = () => {
		if (cfg.themeEnabled === false || cfg.forceDark === false) return;
		const html = document.documentElement;
		if (html.dataset.dsThemeSource === "light") return;
		/* 只在值不同时写，避免 MutationObserver 自触发死循环 */
		if (html.dataset.dsThemeSource !== "dark") html.dataset.dsThemeSource = "dark";
		if (html.style.colorScheme !== "dark") html.style.colorScheme = "dark";
		if (document.body && !document.body.hasAttribute("data-ds-dark-theme")) {
			document.body.setAttribute("data-ds-dark-theme", "");
		}
	};
	applyDarkPalette();
	const paletteGuard = new MutationObserver(() => {
		if (performance.now() - started < 12000) applyDarkPalette();
	});
	try {
		paletteGuard.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ds-theme-source"] });
		if (document.body !== null) paletteGuard.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
	} catch {
		/* 观察失败时仅依赖后续断言 */
	}
	const armPaletteGuard = () => {
		applyDarkPalette();
		try {
			paletteGuard.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
		} catch {
			/* body 不可用时跳过 */
		}
		/* 客户端主题插件加载较晚，可能再次改写属性：周期重断言 12 秒 */
		setTimeout(applyDarkPalette, 3000);
		setTimeout(applyDarkPalette, 7000);
		setTimeout(() => paletteGuard.disconnect(), 12000);
	};
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", armPaletteGuard, { once: true });
	} else {
		armPaletteGuard();
	}

	const emblemEl = overlay.querySelector(".rhine-emblem");
	const bar = overlay.querySelector(".rhine-bar");
	const pctEl = overlay.querySelector(".rhine-pct");
	const statusEl = overlay.querySelector(".rhine-status");

	const LINES = [
		"ESTABLISHING SECURE SESSION",
		"LOADING HARNESS MODULES",
		"CALIBRATING LAB INSTRUMENTS",
		"COMPILING RUNTIME MANIFEST",
		"ALLOCATING WORKSPACE RESOURCES"
	];

	let pct = 0;
	let target = 0;
	let finished = false;
	let ready = false;
	let launching = false;
	let launchRequested = false;
	let appReady = false;
	let fault = false;
	let bootSeen = false;
	let lineIndex = 0;

	const setStatus = (text, error) => {
		statusEl.textContent = text || "";
		statusEl.classList.toggle("rhine-error", Boolean(error));
	};

	const cycleLine = () => {
		if (finished || ready || launching || launchRequested || fault || lineIndex >= LINES.length) return;
		setStatus(LINES[lineIndex++]);
		if (lineIndex < LINES.length) setTimeout(cycleLine, 460 + Math.random() * 240);
	};
	setTimeout(cycleLine, 60);

	const tick = () => {
		if (finished) return;
		const elapsed = performance.now() - started;
		const t = Math.min(elapsed / cfg.maxDisplayMs, 1);
		target = (ready || launching ? 100 : 96) * Math.pow(t, 1.35);
		pct += (target - pct) * 0.12;
		if (ready || launching) pct = 100;
		bar.style.width = `${pct.toFixed(2)}%`;
		pctEl.textContent = `${String(Math.min(99, Math.round(pct))).padStart(3, "0")}%`;
		requestAnimationFrame(tick);
	};
	if (reduce) {
		bar.style.width = "100%";
		pctEl.textContent = "100%";
	} else {
		requestAnimationFrame(tick);
	}

	const doLaunch = () => {
		if (finished || launching) return;
		launching = true;
		if (fault) {
			setStatus("CONTINUE…");
		} else {
			setStatus("LAUNCHING…");
		}
		bar.style.width = "100%";
		pctEl.textContent = "100%";
		const flash = document.createElement("div");
		flash.className = "rhine-flash";
		emblemEl.appendChild(flash);
		overlay.classList.remove("rhine-ready");
		overlay.classList.add("rhine-launching");
		setTimeout(() => {
			finished = true;
			overlay.classList.add("rhine-out");
			setTimeout(() => overlay.remove(), cfg.fadeMs + 60);
		}, fault ? 260 : 480);
	};

	const requestLaunch = () => {
		if (finished || launching) return;
		launchRequested = true;
		if (fault) {
			doLaunch();
			return;
		}
		/* 重播场景：页面早已加载、从未出现启动屏 → 应用必然已就绪，点击立即进入 */
		const alreadyMounted = !bootSeen && performance.now() - started > 1500;
		if (appReady || alreadyMounted) {
			doLaunch();
		} else {
			setStatus("LAUNCH ACCEPTED · WAITING FOR HARNESS…");
		}
	};

	const enterReady = () => {
		if (finished || ready || launching || fault) return;
		ready = true;
		appReady = true;
		bar.style.width = "100%";
		pctEl.textContent = "100%";
		overlay.classList.add("rhine-ready");
		setStatus("SYSTEM READY · 点击鲸鱼图标启动 · CLICK TO LAUNCH");
	};

	const forceReady = () => {
		if (finished || ready || launching) return;
		if (!appReady) appReady = true;
		if (launchRequested && !fault) doLaunch();
		else if (!fault) enterReady();
	};

	/* 若应用一直未就绪（例如开发模式无启动屏），强制进入可交互状态 */
	setTimeout(forceReady, Math.max(cfg.maxDisplayMs, 7000));
	if (Number(cfg.autoLaunchMs) > 0) {
		setTimeout(() => {
			if (!finished) requestLaunch();
		}, Number(cfg.autoLaunchMs));
	}

	/* 交互：点击徽记（或覆盖层任意处）、回车/空格/Esc 均可启动 */
	const launchHandler = (event) => {
		requestLaunch();
		event.preventDefault();
	};
	overlay.addEventListener("click", launchHandler);
	window.addEventListener("keydown", (event) => {
		if (finished) return;
		if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
			requestLaunch();
			event.preventDefault();
		}
	});

	const checkFault = () => {
		const boot = document.querySelector('[data-dsh-boot]');
		const failed = boot ? boot.querySelector('[class*="_failed"]') : null;
		if (!failed) return false;
		fault = true;
		const text = (failed.textContent || "").trim().split(/\s*\n\s*/)[0] || "PLUGIN LOAD FAILURE";
		setStatus(`BOOT FAULT · ${text.toUpperCase().slice(0, 64)}`, true);
		overlay.classList.add("rhine-ready");
		bar.style.width = "100%";
		pctEl.textContent = "100%";
		return true;
	};

	const observer = new MutationObserver(() => {
		if (finished) return;
		const boot = document.querySelector('[data-dsh-boot]');
		if (boot) {
			bootSeen = true;
			if (checkFault()) return;
		} else if (bootSeen && !checkFault()) {
			if (launchRequested) doLaunch();
			else enterReady();
		}
	});
	try {
		observer.observe(document.documentElement, { subtree: true, childList: true });
	} catch {
		/* 观察失败时仅依赖计时兜底 */
	}

	/* 兜底：极快机器上启动屏可能在观察前就已出现并消失 */
	setTimeout(() => {
		if (finished || bootSeen) return;
		const boot = document.querySelector('[data-dsh-boot]');
		if (boot) {
			bootSeen = true;
			checkFault();
		}
	}, 600);
};

/* 无需刷新即可重播：Ctrl+Alt+B 或调用 window.__DSH_BOOT_RHINE_REPLAY__() */
globalThis.__DSH_BOOT_RHINE_REPLAY__ = () => {
	document.getElementById("dsh-rhine-overlay")?.remove();
	bootRhine();
};
window.addEventListener("keydown", (event) => {
	if (event.ctrlKey && event.altKey && (event.key === "b" || event.key === "B")) {
		globalThis.__DSH_BOOT_RHINE_REPLAY__();
		event.preventDefault();
	}
});

bootRhine();
