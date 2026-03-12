"use client";

import { useEffect, useState } from "react";

const FALLBACK_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80";

const STORAGE_PREFIX = "flashmarket:product-image-v2:";

interface UseProductImageOptions {
  fallbackImageUrl?: string;
}

export function useProductImage(
  productName: string,
  options?: UseProductImageOptions
) {
  const fallbackImage = options?.fallbackImageUrl ?? FALLBACK_FOOD_IMAGE;
  const [imageUrl, setImageUrl] = useState<string>(fallbackImage);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!productName?.trim()) {
      setImageUrl(fallbackImage);
      setLoading(false);
      return;
    }

    const cacheKey = `${STORAGE_PREFIX}${productName.toLowerCase().trim()}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setImageUrl(cached);
        setLoading(false);
        return;
      }
    } catch {
      // Ignore storage errors and continue with network fetch.
    }

    let cancelled = false;

    async function fetchImage() {
      setLoading(true);

      try {
        // Call internal server-side route — keeps Google API key off the client.
        const response = await fetch(
          `/api/product-image?q=${encodeURIComponent(productName)}`
        );

        if (!response.ok) {
          if (!cancelled) setImageUrl(fallbackImage);
          return;
        }

        const data = (await response.json()) as { imageUrl?: string | null };
        const nextImage = data.imageUrl || fallbackImage;

        if (!cancelled) {
          setImageUrl(nextImage);
        }

        try {
          sessionStorage.setItem(cacheKey, nextImage);
        } catch {
          // Ignore storage errors.
        }
      } catch {
        if (!cancelled) {
          setImageUrl(fallbackImage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchImage();

    return () => {
      cancelled = true;
    };
  }, [fallbackImage, productName]);

  return { imageUrl, loading, fallbackImageUrl: fallbackImage };
}
