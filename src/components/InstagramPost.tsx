"use client"; 

export function InstagramPost({url}: {url: string}) {
	// Extract post ID from Instagram URL
	const postId = url.match(/\/p\/([^\/]+)/)?.[1] || url.match(/\/reel\/([^\/]+)/)?.[1]
	
	if (!postId) return null

	return (
		<div className="flex justify-center">
			<iframe
				title="Instagram post"
				src={`https://www.instagram.com/p/${postId}/embed`}
				width="500"
				height="880"
				loading="lazy"
				className="border-0 max-w-full"
			/>
		</div>
	);
}