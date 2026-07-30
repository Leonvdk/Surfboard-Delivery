/**
 * Live beach webcam embedded from MEO Beachcam's own iframe player
 * (beachcam.meo.pt/iframe_player.html?cam=<id>) — the real, continuous live
 * stream, not a timelapse. The `cam` id is the segment Beachcam uses in its
 * stream path (auth-beachcam/<cam>/playlist.m3u8).
 *
 * Served over https and sized to a 16:9 frame by the .surfcam-player CSS.
 */
export function BeachcamCam({ cam, label }: { cam: string; label: string }) {
	return (
		<div className="surfcam-player">
			<iframe
				src={`https://beachcam.meo.pt/iframe_player.html?cam=${encodeURIComponent(cam)}`}
				title={`Live webcam — ${label}`}
				allow="autoplay; fullscreen"
				allowFullScreen
				loading="lazy"
			/>
		</div>
	);
}
