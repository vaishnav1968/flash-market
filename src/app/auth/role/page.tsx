"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { UserRole } from "@/lib/types";

export default function RoleSelectionPage() {
	const router = useRouter();
	const { session, refreshRole, signInWithGoogle, loading } = useAuth();
	const { latitude, longitude, error: geolocationError } = useGeolocation();
	const [role, setRole] = useState<UserRole>("buyer");
	const [fullName, setFullName] = useState("");
	const [phone, setPhone] = useState("");
	const [shopName, setShopName] = useState("");
	const [baseLatitude, setBaseLatitude] = useState("");
	const [baseLongitude, setBaseLongitude] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (latitude != null && !baseLatitude) {
			setBaseLatitude(latitude.toFixed(6));
		}
		if (longitude != null && !baseLongitude) {
			setBaseLongitude(longitude.toFixed(6));
		}
	}, [latitude, longitude, baseLatitude, baseLongitude]);

	const parsedBaseLatitude =
		baseLatitude.trim() === "" ? null : Number(baseLatitude.trim());
	const parsedBaseLongitude =
		baseLongitude.trim() === "" ? null : Number(baseLongitude.trim());

	const hasValidCoordinates =
		parsedBaseLatitude != null &&
		parsedBaseLongitude != null &&
		Number.isFinite(parsedBaseLatitude) &&
		Number.isFinite(parsedBaseLongitude) &&
		Math.abs(parsedBaseLatitude) <= 90 &&
		Math.abs(parsedBaseLongitude) <= 180;

	const mapEmbedUrl = useMemo(() => {
		if (!hasValidCoordinates || parsedBaseLatitude == null || parsedBaseLongitude == null) {
			return null;
		}

		const delta = 0.01;
		const left = parsedBaseLongitude - delta;
		const right = parsedBaseLongitude + delta;
		const top = parsedBaseLatitude + delta;
		const bottom = parsedBaseLatitude - delta;

		return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${parsedBaseLatitude}%2C${parsedBaseLongitude}`;
	}, [hasValidCoordinates, parsedBaseLatitude, parsedBaseLongitude]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!session) {
			await signInWithGoogle();
			return;
		}

		setSubmitting(true);
		setError(null);

		if (role === "vendor" && !hasValidCoordinates) {
			setError("Please enter valid base coordinates for your vendor location.");
			setSubmitting(false);
			return;
		}

		try {
			const response = await fetch("/api/users", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({
					role,
					fullName,
					phone,
					shopName,
					latitude:
						role === "vendor"
							? parsedBaseLatitude
							: latitude,
					longitude:
						role === "vendor"
							? parsedBaseLongitude
							: longitude,
				}),
			});

			const data = (await response.json()) as {
				error?: string;
				latitude?: number | null;
				longitude?: number | null;
			};

			if (!response.ok) {
				throw new Error(data.error || "Failed to save profile");
			}

			await refreshRole();
			router.push(role === "vendor" ? "/vendor" : "/deliveries");
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unknown error");
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center text-gray-500">
				Loading role setup...
			</div>
		);
	}

	if (!session) {
		return (
			<div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
				<h1 className="text-3xl font-bold text-gray-900">Finish Setting Up FlashMarket</h1>
				<p className="text-sm text-gray-600">
					Sign in first, then choose whether you want to sell food as a vendor or discover and deliver orders as a buyer.
				</p>
				<button
					onClick={signInWithGoogle}
					className="rounded-lg bg-[#458B73] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#458B73]/90"
				>
					Sign in with Google
				</button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-extrabold text-gray-900">Choose Your Role</h1>
				<p className="mt-2 text-sm text-gray-600">
					Vendors list surplus food. Buyers browse flash deals and can use the delivery map.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
				<div className="grid gap-4 sm:grid-cols-2">
					<button
						type="button"
						onClick={() => setRole("buyer")}
						className={`rounded-xl border p-4 text-left transition-colors ${
							role === "buyer"
								? "border-[#458B73] bg-[#EEF6F3]"
								: "border-gray-200 hover:border-gray-300"
						}`}
					>
						<div className="text-2xl">🛒</div>
						<h2 className="mt-2 font-semibold text-gray-900">Buyer</h2>
						<p className="mt-1 text-sm text-gray-600">
							Claim flash-sale items and access the nearby delivery map.
						</p>
					</button>

					<button
						type="button"
						onClick={() => setRole("vendor")}
						className={`rounded-xl border p-4 text-left transition-colors ${
							role === "vendor"
								? "border-[#FF9760] bg-[#FFF8EC]"
								: "border-gray-200 hover:border-gray-300"
						}`}
					>
						<div className="text-2xl">📦</div>
						<h2 className="mt-2 font-semibold text-gray-900">Vendor</h2>
						<p className="mt-1 text-sm text-gray-600">
							Create listings, manage inventory, and use the vendor dashboard.
						</p>
					</button>
				</div>

				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					<label className="block text-sm text-gray-700">
						Full name
						<input
							value={fullName}
							onChange={(event) => setFullName(event.target.value)}
							className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#458B73]"
							placeholder="Your name"
						/>
					</label>
					<label className="block text-sm text-gray-700">
						Phone
						<input
							value={phone}
							onChange={(event) => setPhone(event.target.value)}
							className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#458B73]"
							placeholder="Optional"
						/>
					</label>
				</div>

				<p className="mt-4 text-xs text-gray-500">
					{latitude != null && longitude != null
						? "Your current location is available and can be used as a starting point."
						: geolocationError || "Allow location access for quick coordinate autofill and accurate delivery pricing."}
				</p>

				{role === "vendor" && (
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<label className="block text-sm text-gray-700">
							Shop name
							<input
								value={shopName}
								onChange={(event) => setShopName(event.target.value)}
								className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#FF9760]"
								placeholder="Raj's Street Kitchen"
								required
							/>
						</label>
						<label className="block text-sm text-gray-700">
								Base latitude
							<input
									type="number"
									step="any"
									value={baseLatitude}
									onChange={(event) => setBaseLatitude(event.target.value)}
								className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#FF9760]"
									placeholder="12.9716"
								required
							/>
						</label>
							<label className="block text-sm text-gray-700 sm:col-span-2">
								Base longitude
								<input
									type="number"
									step="any"
									value={baseLongitude}
									onChange={(event) => setBaseLongitude(event.target.value)}
									className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#FF9760]"
									placeholder="77.5946"
									required
								/>
							</label>

							<div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
								<div className="mb-2 flex items-center justify-between gap-2">
									<p className="text-sm font-medium text-gray-800">Base location preview</p>
									<button
										type="button"
										onClick={() => {
											if (latitude != null && longitude != null) {
												setBaseLatitude(latitude.toFixed(6));
												setBaseLongitude(longitude.toFixed(6));
											}
										}}
										className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
									>
										Use my current location
									</button>
								</div>
								{mapEmbedUrl ? (
									<iframe
										title="Vendor base location map"
										src={mapEmbedUrl}
										className="h-52 w-full rounded-lg border border-gray-200"
										loading="lazy"
									/>
								) : (
									<div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-xs text-gray-500">
										Enter valid latitude and longitude to preview a marker on the map.
									</div>
								)}
							</div>
					</div>
				)}

				{error && (
					<p className="mt-4 rounded-lg border border-[#F26076]/30 bg-[#FFF0F3] px-3 py-2 text-sm text-[#F26076]">
						{error}
					</p>
				)}

				<button
					type="submit"
					disabled={submitting}
					className="mt-6 w-full rounded-lg bg-[#458B73] px-4 py-3 text-sm font-semibold text-white hover:bg-[#458B73]/90 disabled:opacity-60"
				>
					{submitting ? "Saving profile..." : `Continue as ${role}`}
				</button>
			</form>
		</div>
	);
}
