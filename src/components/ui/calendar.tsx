import { cn } from '@/lib/utils';

type CalendarProps = {
	mode?: "single" | "range";
	selected?: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	initialFocus?: boolean;
};

function formatDateForInput(date?: Date) {
	if (!date) return "";
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function Calendar({ selected, onSelect }: CalendarProps) {
	return (
		<div className="p-3">
			{/* Minimal calendar replacement: native date input */}
				<input
					type="date"
					className={cn(
						"appearance-none rounded-md border bg-background text-foreground",
						"border rounded px-2 py-1"
					)}
					value={formatDateForInput(selected)}
					onChange={(e) => {
						const v = e.target.value;
						if (!v) return onSelect(undefined);
						const d = new Date(v + "T00:00:00");
						onSelect(d);
					}}
				/>
		</div>
	);
}

export default Calendar;
