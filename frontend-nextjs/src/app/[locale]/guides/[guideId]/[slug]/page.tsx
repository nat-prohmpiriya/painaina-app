import GuideViewClientWrapper from "@/components/guide/GuideViewClientWrapper";
import type { Metadata } from "next";
import type { TripDetailResponse } from "@/interfaces/trip.interface";

interface Props {
	params: {
		guideId: string;
		slug: string;
	};
}

async function getGuideById(guideId: string): Promise<TripDetailResponse | null> {
	try {
		// Use API_URL for server-side (Docker network) or fallback to NEXT_PUBLIC_API_URL
		const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
		const response = await fetch(`${apiUrl}/trips/${guideId}`, {
			cache: 'no-store', // For SSR - always fetch fresh data
		})

		if (!response.ok) {
			return null
		}

		const result = await response.json()
		return result.data
	} catch (error) {
		console.error('Error fetching guide:', error)
		return null
	}
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const resolvedParams = await params;
	const guide = await getGuideById(resolvedParams.guideId);

	if (!guide) {
		return {
			title: "Guide Not Found",
		};
	}

	return {
		title: guide.title,
		description: guide.description,
		openGraph: {
			title: guide.title,
			description: guide.description,
			images: guide.coverPhoto ? [guide.coverPhoto] : [],
		},
	};
}

const GuideViewPage = async ({ params }: Props) => {
	const resolvedParams = await params;
	const guide = await getGuideById(resolvedParams.guideId);
	if (!guide) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900">Guide Not Found</h1>
					<p className="text-gray-600 mt-2">The guide you're looking for doesn't exist.</p>
				</div>
			</div>
		);
	}

	return <GuideViewClientWrapper guide={guide} />;
};

export default GuideViewPage;