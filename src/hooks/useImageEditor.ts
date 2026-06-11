import { useRef, useCallback, useEffect } from 'react';
import type { EditorState } from '../types';
import { useImageStore } from '../store/useImageStore';

export function useImageEditor(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  imageUrl: string | null
) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const editorState = useImageStore((state) => state.editorState);
  const setEditorState = useImageStore((state) => state.setEditorState);

  const loadImage = useCallback(() => {
    if (!imageUrl || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      render();
    };
    img.onerror = () => {
      console.error('Failed to load image');
    };
    img.src = imageUrl;
  }, [imageUrl, canvasRef]);

  const render = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const { rotation, zoom, crop, spots } = editorState;

    const scale = zoom / 100;
    const radians = (rotation * Math.PI) / 180;

    let displayWidth = img.width * scale;
    let displayHeight = img.height * scale;

    if (rotation === 90 || rotation === 270) {
      [displayWidth, displayHeight] = [displayHeight, displayWidth];
    }

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.drawImage(
      img,
      -(img.width * scale) / 2,
      -(img.height * scale) / 2,
      img.width * scale,
      img.height * scale
    );
    ctx.restore();

    if (spots && spots.length > 0) {
      ctx.save();
      spots.forEach((spot) => {
        const x = spot.x * scale;
        const y = spot.y * scale;
        const radius = spot.radius * scale;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(201, 169, 98, 0.6)');
        gradient.addColorStop(0.7, 'rgba(201, 169, 98, 0.3)');
        gradient.addColorStop(1, 'rgba(201, 169, 98, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(201, 169, 98, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    if (crop && editorState.isCropping) {
      const x = crop.x * scale;
      const y = crop.y * scale;
      const w = crop.width * scale;
      const h = crop.height * scale;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(x, y, w, h);
      ctx.strokeStyle = '#C9A962';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }, [canvasRef, editorState]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    render();
  }, [render, editorState]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!editorState.isSpotRemoving || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scale = editorState.zoom / 100;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newSpot = { x, y, radius: editorState.brushSize };
      setEditorState({
        spots: [...editorState.spots, newSpot],
      });
    },
    [editorState.isSpotRemoving, editorState.zoom, editorState.brushSize, editorState.spots, canvasRef, setEditorState]
  );

  const rotateLeft = useCallback(() => {
    setEditorState({
      rotation: (editorState.rotation - 90 + 360) % 360,
    });
  }, [editorState.rotation, setEditorState]);

  const rotateRight = useCallback(() => {
    setEditorState({
      rotation: (editorState.rotation + 90) % 360,
    });
  }, [editorState.rotation, setEditorState]);

  const setZoom = useCallback(
    (zoom: number) => {
      setEditorState({ zoom: Math.max(10, Math.min(200, zoom)) });
    },
    [setEditorState]
  );

  const startCropping = useCallback(() => {
    if (!imageRef.current) return;
    setEditorState({
      isCropping: true,
      isSpotRemoving: false,
      crop: {
        x: imageRef.current.width * 0.1,
        y: imageRef.current.height * 0.1,
        width: imageRef.current.width * 0.8,
        height: imageRef.current.height * 0.8,
      },
    });
  }, [setEditorState]);

  const startSpotRemoving = useCallback(() => {
    setEditorState({
      isSpotRemoving: true,
      isCropping: false,
    });
  }, [setEditorState]);

  const cancelEdit = useCallback(() => {
    setEditorState({
      isCropping: false,
      isSpotRemoving: false,
      crop: undefined,
    });
  }, [setEditorState]);

  const clearSpots = useCallback(() => {
    setEditorState({ spots: [] });
  }, [setEditorState]);

  const setBrushSize = useCallback(
    (size: number) => {
      setEditorState({ brushSize: Math.max(5, Math.min(100, size)) });
    },
    [setEditorState]
  );

  return {
    handleCanvasClick,
    rotateLeft,
    rotateRight,
    setZoom,
    startCropping,
    startSpotRemoving,
    cancelEdit,
    clearSpots,
    setBrushSize,
    render,
    loadImage,
  };
}
