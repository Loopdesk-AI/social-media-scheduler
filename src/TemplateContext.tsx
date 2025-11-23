export * from "./context/TemplatesContext";

// Backwards-compatible re-export so imports like `./TemplateContext` from
// files in `src/` continue to work. The real implementation lives in
// `src/context/TemplatesContext.tsx`.
