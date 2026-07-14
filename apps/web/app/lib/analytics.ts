declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

/*
 * Event taxonomy — three questions we want GA4 to answer:
 *   1. How do people navigate?  → page_view (GA4 Enhanced Measurement, incl.
 *      "page changes based on browser history events") + cta_clicked.
 *   2. If/how do they convert?  → the booking_* funnel, ending in
 *      booking_form_submitted (the key event).
 *   3. What actions do they perform? → calculators, estimate, popups, outbound
 *      clicks, scroll/time engagement.
 *
 * All custom events flow through send(), which tags likely bots with
 * traffic_type:"bot" so a GA4 data filter (or Cloudflare at the edge) can
 * exclude them. Note: automatic events (page_view, session_start, scroll from
 * Enhanced Measurement) do NOT pass through here, so bot exclusion must also be
 * configured in GA4 / Cloudflare — the JS tag alone cannot keep bots out.
 */

const BOT_PATTERN =
	/bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|bingpreview|mj12bot|semrush|ahref|yandex|baidu|duckduckbot|googlebot|mediapartners|adsbot|apis-google|feedfetcher|lighthouse|pagespeed|headlesschrome|phantomjs|prerender|snap-prefetch|wget|curl|python-requests|go-http-client|java\/|okhttp|httpx|node-fetch|cf-ray/i;

export function isBot(): boolean {
	if (typeof navigator === "undefined") return false;
	if (BOT_PATTERN.test(navigator.userAgent)) return true;
	// Headless / automated browsers expose webdriver.
	if (typeof navigator !== "undefined" && navigator.webdriver) return true;
	return false;
}

function send(eventName: string, params?: Record<string, unknown>) {
	if (typeof window === "undefined" || !window.gtag) return;
	if (isBot()) {
		window.gtag("event", eventName, { ...params, traffic_type: "bot" });
		return;
	}
	window.gtag("event", eventName, params);
}

// ── Primary conversion (mark as the key event in GA4) ────────────────

export function trackBookingSubmitted(params: {
	people_count: number;
	nights: number | null;
	packages: string;
	has_wetsuit: boolean;
	prefilled: boolean;
	estimated_total: number | null;
}) {
	send("booking_form_submitted", {
		...params,
		currency: "EUR",
		value: params.estimated_total ?? 0,
	});
}

// ── Booking funnel (namespaced so it never collides with GA4's automatic
//    form_start / form_submit Enhanced Measurement events) ─────────────

export function trackBookingFormStart() {
	send("booking_form_start");
}

/** Milestone within the form, e.g. "dates_selected", "package_selected",
 *  "contact_details_filled". Lets us build a funnel exploration. */
export function trackBookingStep(step: string) {
	send("booking_step_completed", { step_name: step });
}

export function trackBookingFieldFocused(fieldName: string) {
	send("booking_field_focused", { field_name: fieldName });
}

export function trackBookingAbandoned(params: {
	last_field: string;
	fields_completed: number;
	time_spent: number;
}) {
	send("booking_form_abandoned", params);
}

/** Fired when the live price estimate first becomes visible / complete. */
export function trackBookingEstimateShown(params: {
	value: number;
	all_selected: boolean;
	people_count: number;
}) {
	send("booking_estimate_shown", {
		...params,
		currency: "EUR",
	});
}

// ── In-form calculators (high-intent actions) ────────────────────────

export function trackBoardCalcOpened() {
	send("board_calculator_opened");
}

export function trackBoardCalcResult(board: string) {
	send("board_calculator_result", { recommended_board: board });
}

export function trackWetsuitCalcOpened(sex: string) {
	send("wetsuit_calculator_opened", { wetsuit_sex: sex });
}

export function trackWetsuitCalcResult(params: { sex: string; size: string }) {
	send("wetsuit_calculator_result", {
		wetsuit_sex: params.sex,
		wetsuit_size: params.size,
	});
}

// ── Contact page arrival (where booking intent comes from) ───────────

export function trackContactPageView(params: {
	referrer_path: string;
	query_params: string;
	prefilled: boolean;
}) {
	send("contact_page_view", params);
}

// ── CTAs & outbound (micro-conversions) ──────────────────────────────

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

// ── Pricing page interaction ─────────────────────────────────────────

export function trackPricingDurationToggled(duration: string) {
	send("pricing_duration_toggled", { selected_duration: duration });
}

// ── Blog CTA popup ───────────────────────────────────────────────────

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

// ── Blog engagement (read depth) ─────────────────────────────────────

export function trackBlogPostRead(params: {
	post_slug: string;
	reading_time: number;
	scroll_depth: number;
	time_spent: number;
}) {
	send("blog_post_read", params);
}

// ── Scroll depth & time on page ──────────────────────────────────────

export function trackScrollDepth(depth: number, pagePath: string) {
	send("scroll_depth", {
		percent_scrolled: depth,
		page_path: pagePath,
	});
}

export function trackTimeOnPage(seconds: number, pagePath: string) {
	send("time_on_page", {
		engagement_seconds: seconds,
		page_path: pagePath,
	});
}
