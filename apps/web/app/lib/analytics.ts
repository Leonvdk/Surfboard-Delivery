declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

const BOT_PATTERN =
	/bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|bingpreview|mj12bot|semrush|ahref|yandex|baidu|duckduckbot|googlebot|mediapartners|adsbot|apis-google|feedfetcher|lighthouse|pagespeed|headlesschrome|phantomjs|prerender|snap-prefetch|wget|curl|python-requests|go-http-client|java\/|okhttp|httpx|node-fetch|cf-ray/i;

export function isBot(): boolean {
	if (typeof navigator === "undefined") return false;
	return BOT_PATTERN.test(navigator.userAgent);
}

function send(eventName: string, params?: Record<string, unknown>) {
	if (typeof window !== "undefined" && window.gtag) {
		if (isBot()) {
			window.gtag("event", eventName, {
				...params,
				traffic_type: "bot",
			});
			return;
		}
		window.gtag("event", eventName, params);
	}
}

// ── Primary conversion ──────────────────────────────────────────────

export function trackBookingSubmitted(params: {
	people_count: number;
	checkin: string;
	checkout: string;
	estimated_total: number | null;
}) {
	send("booking_form_submitted", {
		...params,
		currency: "EUR",
		value: params.estimated_total ?? 0,
	});
}

// ── Micro-conversions (high intent) ─────────────────────────────────

export function trackCtaClick(params: {
	cta_text: string;
	cta_location: string;
	destination?: string;
}) {
	send("cta_clicked", params);
}

export function trackWhatsAppClick(location: string) {
	send("whatsapp_click", { link_location: location });
}

export function trackEmailClick(location: string) {
	send("email_click", { link_location: location });
}

export function trackPhoneClick(location: string) {
	send("phone_click", { link_location: location });
}

// ── Blog CTA popup ──────────────────────────────────────────────────

export function trackBlogPopupShown(page: string) {
	send("blog_popup_shown", { page_path: page });
}

export function trackBlogPopupClicked(page: string) {
	send("blog_popup_clicked", { page_path: page });
}

export function trackBlogPopupDismissed(page: string) {
	send("blog_popup_dismissed", { page_path: page });
}

// ── Newsletter popup ─────────────────────────────────────────────────

export function trackNewsletterPopupShown(page: string) {
	send("newsletter_popup_shown", { page_path: page });
}

export function trackNewsletterPopupSubmitted(page: string) {
	send("newsletter_popup_submitted", { page_path: page });
}

export function trackNewsletterPopupDismissed(page: string) {
	send("newsletter_popup_dismissed", { page_path: page });
}

// ── Scroll depth ────────────────────────────────────────────────────

export function trackScrollDepth(depth: number, pagePath: string) {
	send("scroll_depth", {
		percent_scrolled: depth,
		page_path: pagePath,
	});
}

// ── Time on page ────────────────────────────────────────────────────

export function trackTimeOnPage(seconds: number, pagePath: string) {
	send("time_on_page", {
		engagement_seconds: seconds,
		page_path: pagePath,
	});
}

// ── Contact page arrival ────────────────────────────────────────────

export function trackContactPageView(params: {
	referrer_path: string;
	query_params: string;
}) {
	send("contact_page_view", params);
}

// ── Pricing interaction ─────────────────────────────────────────────

export function trackPricingView(duration: string) {
	send("pricing_viewed", { selected_duration: duration });
}

export function trackPackageSelected(params: {
	package_name: string;
	duration: string;
	price: string;
}) {
	send("package_selected", params);
}

// ── Blog engagement ─────────────────────────────────────────────────

export function trackBlogPostRead(params: {
	post_slug: string;
	post_title: string;
	reading_time: number;
	scroll_depth: number;
	time_spent: number;
}) {
	send("blog_post_read", params);
}

// ── Form interaction (funnel) ───────────────────────────────────────

export function trackFormFieldFocused(fieldName: string) {
	send("form_field_focused", { field_name: fieldName });
}

export function trackFormStepCompleted(step: string) {
	send("form_step_completed", { step_name: step });
}

export function trackFormAbandoned(params: {
	last_field: string;
	fields_completed: number;
	time_spent: number;
}) {
	send("form_abandoned", params);
}
