export function getSelectedModel(): string {
  if (typeof window !== "undefined") {
    const storedModel = localStorage.getItem("selectedModel");
    return storedModel || "Browser Model";
  } else {
    // Default model
    return "Browser Model";
  }
}
