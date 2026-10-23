(function () {
	function D(s) { try { return atob(s); } catch (e) { return s; } }
	function get(k, def) { try { return localStorage.getItem(k) || def; } catch (e) { return def; } }

	// Apply cloaking
	const title = get("cloak_title", "");
	const icon = get("cloak_icon", "");
	const panicKey = get("cloak_panic_key", "");
	const panicUrl = get("cloak_panic_url", "https://classroom.google.com");

	if (title) document.title = title;
	if (icon) {
		let link = document.querySelector('link[rel="icon"]');
		if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
		link.href = icon;
	}

	// Panic key
	if (panicKey) {
		document.addEventListener("keydown", function (e) {
			if (e.key === panicKey) {
				window.location.href = panicUrl;
			}
		});
	}

	// Tab disguise on blur (optional): change title when tab hidden
	const originalTitle = document.title;
	document.addEventListener("visibilitychange", function () {
		if (document.hidden) {
			document.title = "Google Classroom";
		} else {
			document.title = title || originalTitle;
		}
	});

	window.__cloak = { D, get };
})();
