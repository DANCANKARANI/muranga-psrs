export { cn } from "cn"

export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-KE", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export function generateTrackingId(): string {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	const randomValues = crypto.getRandomValues(new Uint8Array(4));
	const suffix = Array.from(randomValues, (value) =>
		alphabet.charAt(value % alphabet.length),
	).join("");

	return `MCG-${new Date().getFullYear()}-${suffix}`;
}

export function truncate(text: string, length = 60): string {
	if (text.length <= length) return text;
	if (length <= 3) return text.slice(0, Math.max(0, length));
	return `${text.slice(0, length - 3).trimEnd()}...`;
}

export function formatTimeAgo(date: Date, now = new Date()): string {
	const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
	const years = Math.floor(months / 12);
	return `${years} year${years === 1 ? "" : "s"} ago`;
}
