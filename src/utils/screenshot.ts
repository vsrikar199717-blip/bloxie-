interface PartInfo {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  transform: string;
}

export async function captureElement(element: HTMLElement): Promise<string | null> {
  try {
    const rect = element.getBoundingClientRect();
    const scale = 2; // Higher resolution
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);

    // Find all draggable part containers (the outer div with position/transform)
    // These are direct children with 'absolute' positioning
    const partContainers = element.querySelectorAll(':scope > div.absolute');
    const parts: PartInfo[] = [];

    partContainers.forEach((container) => {
      const containerEl = container as HTMLElement;
      const img = containerEl.querySelector('img');
      if (!img) return;

      // Get the container's computed style (where transform and position live)
      const containerStyle = window.getComputedStyle(containerEl);

      // Parse position from style (left, top)
      const left = parseFloat(containerStyle.left) || 0;
      const top = parseFloat(containerStyle.top) || 0;
      const width = parseFloat(containerStyle.width) || 80;
      const height = parseFloat(containerStyle.height) || 80;
      const zIndex = parseInt(containerStyle.zIndex) || 0;
      const transform = containerStyle.transform;

      parts.push({
        img,
        x: left,
        y: top,
        width,
        height,
        zIndex,
        transform,
      });
    });

    // Sort by zIndex so lower items are drawn first (painter's algorithm)
    parts.sort((a, b) => a.zIndex - b.zIndex);

    // Load and draw each part
    for (const part of parts) {
      await new Promise<void>((resolve) => {
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        tempImg.onload = () => {
          ctx.save();

          // Move to part center for transforms
          const centerX = part.x + part.width / 2;
          const centerY = part.y + part.height / 2;
          ctx.translate(centerX, centerY);

          // Apply transform matrix from the container
          if (part.transform && part.transform !== 'none') {
            const match = part.transform.match(/matrix\(([^)]+)\)/);
            if (match) {
              const values = match[1].split(',').map(Number);
              ctx.transform(values[0], values[1], values[2], values[3], values[4], values[5]);
            }
          }

          // Draw image centered at the transformed position
          ctx.drawImage(tempImg, -part.width / 2, -part.height / 2, part.width, part.height);
          ctx.restore();
          resolve();
        };
        tempImg.onerror = () => resolve(); // Skip failed images
        tempImg.src = part.img.src;
      });
    }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Screenshot failed:', error);
    return null;
  }
}

export function downloadImage(dataUrl: string, filename: string = 'robot-reading-creation.png') {
  // Try standard download first
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // On iPad/iOS, also try opening in new tab as fallback
  // Users can long-press to save the image
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    setTimeout(() => {
      window.open(dataUrl, '_blank');
    }, 100);
  }
}

export async function captureAndDownload(element: HTMLElement, filename?: string): Promise<boolean> {
  const dataUrl = await captureElement(element);

  if (dataUrl) {
    downloadImage(dataUrl, filename);
    return true;
  }

  return false;
}
