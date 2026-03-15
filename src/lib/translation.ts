export async function translateToAmharic(text: string): Promise<string> {
  if (!text) return "";

  try {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.append("client", "gtx");
    url.searchParams.append("sl", "en"); // Source: English
    url.searchParams.append("tl", "am"); // Target: Amharic
    url.searchParams.append("dt", "t");
    url.searchParams.append("q", text);

    const res = await fetch(url.toString());
    const data = await res.json();
    
    // Google translate returns nested arrays. e.g. [ [ ["Translated", "Original", null, null, 1] ] ]
    const translatedText = data[0].map((item: any) => item[0]).join("");
    return translatedText;
  } catch (err) {
    console.error("Failed to translate to Amharic:", err);
    return "";
  }
}
