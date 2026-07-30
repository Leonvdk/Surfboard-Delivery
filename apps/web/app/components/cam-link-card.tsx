/**
 * Interim live-cam panel: a styled, inviting call-to-action that opens the
 * MEO Beachcam live stream in a new tab. Used while surfrental-aljezur.com is
 * not yet on MEO's `frame-ancestors` allow-list (their CSP blocks the inline
 * iframe until they add the domain). Swap back to <BeachcamCam> once allowed.
 */
export function CamLinkCard({ href, name }: { href: string; name: string }) {
	return (
		<a className="surfcam-linkcard" href={href} target="_blank" rel="noopener noreferrer">
			<span className="surfcam-linkcard-badge">Live · MEO Beachcam</span>
			<span className="surfcam-linkcard-inner">
				<span className="surfcam-linkcard-play" aria-hidden="true">
					<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
						<path d="M8 5v14l11-7z" />
					</svg>
				</span>
				<span className="surfcam-linkcard-title">Watch the live {name} cam</span>
				<span className="surfcam-linkcard-sub">Opens the live stream on MEO Beachcam</span>
			</span>
		</a>
	);
}
