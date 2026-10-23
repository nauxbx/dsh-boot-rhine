// 只开主题（splashEnabled: false）时使用：把调色板固定为深色，
// 让 theme.css / theme-bg.css 的 body[data-ds-dark-theme] 选择器生效。
// 与 boot.js 里的深色守卫同逻辑，但不创建开屏层。
(() => {
	"use strict";
	const apply = () => {
		const html = document.documentElement;
		if (html.dataset.dsThemeSource === "light") return;
		if (html.dataset.dsThemeSource !== "dark") html.dataset.dsThemeSource = "dark";
		if (html.style.colorScheme !== "dark") html.style.colorScheme = "dark";
		if (document.body && !document.body.hasAttribute("data-ds-dark-theme")) {
			document.body.setAttribute("data-ds-dark-theme", "");
		}
	};
	apply();
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", apply, { once: true });
	}
	/* 客户端主题插件加载较晚，可能改写属性：周期重断言 */
	setTimeout(apply, 3000);
	setTimeout(apply, 7000);
	try {
		new MutationObserver(apply).observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-ds-theme-source"]
		});
	} catch {
		/* 观察失败时仅依赖计时兜底 */
	}
})();
