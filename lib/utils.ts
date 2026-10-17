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
