import type { ImageRef } from '@ironwood/shared';
import { imageSrcSet, imageUrl } from '@/lib/aem';
import { cn } from '@/lib/cn';

interface Props {
  image: ImageRef;
  sizes?: string;
  /** Above-the-fold / LCP candidate: eager + high fetch priority. Everything else lazy-loads. */
  priority?: boolean;
  className?: string;
  widths?: readonly number[];
}

/**
 * Media-heavy page performance in one component:
 *  - intrinsic width/height reserve space → zero layout shift
 *  - `srcset`/`sizes` when served from AEM Delivery (WebP + width negotiation)
 *  - lazy + async decoding by default; `priority` for the LCP element
 */
export function ResponsiveImage({
  image,
  sizes = '100vw',
  priority = false,
  className,
  widths = [480, 800, 1200, 1600],
}: Props) {
  const priorityAttrs: Record<string, string> = priority ? { fetchpriority: 'high' } : {};
  return (
    <img
      src={imageUrl(image._path, widths[1] ?? 800)}
      srcSet={imageSrcSet(image._path, widths)}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={cn('h-full w-full object-cover', className)}
      {...priorityAttrs}
    />
  );
}
