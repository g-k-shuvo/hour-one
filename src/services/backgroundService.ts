import type { BackgroundImage } from '@/types';

// Curated collection of nature/landscape image IDs from Unsplash
// These are free to use and don't require API keys when using source.unsplash.com
const CURATED_IMAGE_IDS = [
  '1506905925346-21bda4d32df4', // Mountains
  '1470071459604-3b5ec3a7fe05', // Forest valley
  '1501854140801-50d01698950b', // Northern lights
  '1475924156734-496f6cac6ec1', // Beach sunset
  '1507400492013-162706c8c05e', // Mountain lake
  '1469474968028-56623f02e42e', // Misty forest
  '1509316785289-025f5b846b35', // Desert dunes
  '1519681393784-d120267933ba', // Starry mountains
  '1504701954957-2010ec3bcec1', // Ocean waves
  '1464822759023-fed622ff2c3b', // Volcano
  '1433086966358-54859d0ed716', // Waterfall
  '1530908295418-a12e326966ba', // Canyon
  '1516298773066-f6ec6723e42d', // Tropical beach
  '1502082553048-f009c37129b9', // Autumn forest
  '1491002052546-bf38f186af56', // Snowy peaks
  '1505765050516-f72dcac9c60e', // Calm lake
  '1478827536114-da961b7f86d2', // Rolling hills
  '1500534314209-a25ddb2bd429', // Cherry blossoms
  '1494500764479-0c8f2919a3d8', // Redwood forest
  '1518173946687-a4c8892bbd9f', // Lavender field
];

/**
 * Get a consistent image for today based on the date
 */
function getTodayImageId(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % CURATED_IMAGE_IDS.length;
  return CURATED_IMAGE_IDS[index];
}

/**
 * Get tomorrow's image ID for preloading
 */
function getTomorrowImageId(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayOfYear = Math.floor(
    (tomorrow.getTime() - new Date(tomorrow.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % CURATED_IMAGE_IDS.length;
  return CURATED_IMAGE_IDS[index];
}

/**
 * Build Unsplash image URL
 */
function buildImageUrl(imageId: string, width = 1920, quality = 80): string {
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&q=${quality}&fit=crop&auto=format`;
}

/**
 * Fetch today's background image
 */
export async function fetchTodayBackground(): Promise<BackgroundImage> {
  const imageId = getTodayImageId();
  const url = buildImageUrl(imageId);

  return {
    url,
    photographer: 'Unsplash',
    photographerUrl: `https://unsplash.com/photos/${imageId}`,
  };
}

/**
 * Preload an image to browser cache
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Preload tomorrow's image
 */
export async function preloadTomorrowBackground(): Promise<void> {
  const imageId = getTomorrowImageId();
  const url = buildImageUrl(imageId);
  try {
    await preloadImage(url);
  } catch {
    // Silently fail - preloading is best effort
  }
}

/**
 * Get a random background (for manual refresh)
 */
export function getRandomBackground(): BackgroundImage {
  const randomIndex = Math.floor(Math.random() * CURATED_IMAGE_IDS.length);
  const imageId = CURATED_IMAGE_IDS[randomIndex];
  const url = buildImageUrl(imageId);

  return {
    url,
    photographer: 'Unsplash',
    photographerUrl: `https://unsplash.com/photos/${imageId}`,
  };
}
