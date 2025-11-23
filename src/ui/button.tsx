export * from "../components/ui/button";
export { Button as default } from "../components/ui/button";

// Backwards-compatible re-export so imports like `./ui/button` from `src/`
// resolve to the real component under `src/components/ui/button.tsx`.
