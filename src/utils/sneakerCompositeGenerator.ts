/**
 * Removes white, black or solid neutral studio background from user's product photo
 * so ANY product (snack packaging, clothes, cosmetics, bags, footwear, electronics)
 * blends seamlessly into the scene.
 */
function removeStudioBackground(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const w = img.naturalWidth || img.width || 500;
  const h = img.naturalHeight || img.height || 500;
  c.width = w;
  c.height = h;

  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return c;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // Sample corner pixels to detect solid background color
  const sampleR = (d[0] + d[(w - 1) * 4] + d[(h - 1) * w * 4]) / 3;
  const sampleG = (d[1] + d[(w - 1) * 4 + 1] + d[(h - 1) * w * 4 + 1]) / 3;
  const sampleB = (d[2] + d[(w - 1) * 4 + 2] + d[(h - 1) * w * 4 + 2]) / 3;

  const isLightBg = sampleR > 210 && sampleG > 210 && sampleB > 210;
  const isDarkBg = sampleR < 35 && sampleG < 35 && sampleB < 35;

  if (isLightBg || isDarkBg) {
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      const distToBg = Math.sqrt(
        Math.pow(r - sampleR, 2) + Math.pow(g - sampleG, 2) + Math.pow(b - sampleB, 2)
      );

      if (distToBg < 40) {
        d[i + 3] = 0; // Transparent
      } else if (distToBg < 65) {
        d[i + 3] = Math.round(((distToBg - 40) / 25) * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return c;
}

/**
 * Universal product compositor:
 * Composites the user's EXACT product photo into the competitor video scene
 * with realistic contact shadows, professional framing, and proper aspect ratio.
 * NEVER hardcodes sneakers, shoes, or clothing unless that is the actual product!
 */
export async function generateSneakerEnvironmentComposite(
  variationName: string,
  sceneRole: string,
  environmentDescription: string,
  interactionDescription: string,
  productPhotoBase64?: string,
  referenceFrameBase64?: string
): Promise<string> {
  return new Promise<string>((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280; // 9:16 vertical
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(productPhotoBase64 || '');
      return;
    }

    const finalizeImage = () => {
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    // Helper to render universal clean backdrop
    const renderUniversalStudioBackdrop = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, 1280);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#292524');
      grad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // Subtle warm ambient spotlight
      const spot = ctx.createRadialGradient(360, 640, 50, 360, 640, 550);
      spot.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, 720, 1280);
    };

    // Draw the user's isolated product accurately in scene
    const drawProductAndFinish = (cleanProductCanvas?: HTMLCanvasElement) => {
      if (cleanProductCanvas && cleanProductCanvas.width > 10) {
        const isFootwear = variationName.toLowerCase().includes('tênis') ||
          variationName.toLowerCase().includes('sapato') ||
          sceneRole.toLowerCase().includes('tênis') ||
          sceneRole.toLowerCase().includes('pés');

        if (isFootwear) {
          // Footwear: place on floor/feet level so the person wearing it in the video frame is clearly visible
          const sW = 280;
          const scale = sW / cleanProductCanvas.width;
          const sH = cleanProductCanvas.height * scale;
          const pY = 880;

          // Shadow
          ctx.save();
          ctx.filter = 'blur(16px)';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.ellipse(360, 1080, 220, 36, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Draw sneaker at feet level
          ctx.drawImage(cleanProductCanvas, 220, pY, sW, Math.min(260, sH));
        } else {
          // General product
          ctx.save();
          ctx.filter = 'blur(20px)';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.beginPath();
          ctx.ellipse(360, 960, 240, 48, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          const maxW = 460;
          const maxH = 640;
          const scale = Math.min(maxW / cleanProductCanvas.width, maxH / cleanProductCanvas.height);
          const pW = cleanProductCanvas.width * scale;
          const pH = cleanProductCanvas.height * scale;
          const pX = (720 - pW) / 2;
          const pY = (1280 - pH) / 2 + 30;

          ctx.drawImage(cleanProductCanvas, pX, pY, pW, pH);
        }
      }

      finalizeImage();
    };

    // If competitor video frame exists, use it as real background!
    if (
      referenceFrameBase64 &&
      (referenceFrameBase64.startsWith('data:') ||
        referenceFrameBase64.startsWith('http') ||
        referenceFrameBase64.startsWith('/'))
    ) {
      const refImg = new Image();
      refImg.crossOrigin = 'anonymous';
      refImg.onload = () => {
        ctx.drawImage(refImg, 0, 0, 720, 1280);

        if (productPhotoBase64) {
          const pImg = new Image();
          pImg.crossOrigin = 'anonymous';
          pImg.onload = () => {
            const cleanCanvas = removeStudioBackground(pImg);
            drawProductAndFinish(cleanCanvas);
          };
          pImg.onerror = () => drawProductAndFinish();
          pImg.src = productPhotoBase64;
        } else {
          drawProductAndFinish();
        }
      };
      refImg.onerror = () => {
        renderUniversalStudioBackdrop();
        if (productPhotoBase64) {
          const pImg = new Image();
          pImg.crossOrigin = 'anonymous';
          pImg.onload = () => {
            const cleanCanvas = removeStudioBackground(pImg);
            drawProductAndFinish(cleanCanvas);
          };
          pImg.onerror = () => drawProductAndFinish();
          pImg.src = productPhotoBase64;
        } else {
          finalizeImage();
        }
      };
      refImg.src = referenceFrameBase64;
      return;
    }

    // Default backdrop if no video frame
    renderUniversalStudioBackdrop();
    if (productPhotoBase64) {
      const pImg = new Image();
      pImg.crossOrigin = 'anonymous';
      pImg.onload = () => {
        const cleanCanvas = removeStudioBackground(pImg);
        drawProductAndFinish(cleanCanvas);
      };
      pImg.onerror = () => drawProductAndFinish();
      pImg.src = productPhotoBase64;
    } else {
      finalizeImage();
    }
  });
}
