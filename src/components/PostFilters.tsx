interface PostFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  platformFilter: string;
  setPlatformFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

const platforms = ["All", "Twitter", "Instagram", "LinkedIn"];
const statuses = ["All", "scheduled", "published", "draft"];

export default function PostFilters({
  searchQuery,
  setSearchQuery,
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter,
}: PostFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
      {/* Search */}
      <input
        type="text"
        placeholder="Search post content..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 p-2 rounded-md bg-black/10 dark:bg-white/10"
      />

      {/* Platform Filter */}
      <select
        value={platformFilter}
        onChange={(e) => setPlatformFilter(e.target.value)}
        className="p-2 rounded-md bg-black/10 dark:bg-white/10"
      >
        {platforms.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="p-2 rounded-md bg-black/10 dark:bg-white/10"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
