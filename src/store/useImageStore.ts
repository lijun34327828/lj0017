import { create } from 'zustand';
import type { ImageFile, EditorState } from '../types';

interface ImageStore {
  uploadedImages: ImageFile[];
  selectedImageId: string | null;
  editorState: EditorState;
  addImages: (images: ImageFile[]) => void;
  removeImage: (id: string) => void;
  selectImage: (id: string | null) => void;
  clearAll: () => void;
  setEditorState: (state: Partial<EditorState>) => void;
  resetEditor: () => void;
}

const defaultEditorState: EditorState = {
  rotation: 0,
  zoom: 100,
  isCropping: false,
  isSpotRemoving: false,
  brushSize: 20,
  spots: [],
};

export const useImageStore = create<ImageStore>((set) => ({
  uploadedImages: [],
  selectedImageId: null,
  editorState: defaultEditorState,

  addImages: (images) =>
    set((state) => ({
      uploadedImages: [...state.uploadedImages, ...images],
      selectedImageId: state.selectedImageId || images[0]?.id || null,
    })),

  removeImage: (id) =>
    set((state) => {
      const filtered = state.uploadedImages.filter((img) => img.id !== id);
      return {
        uploadedImages: filtered,
        selectedImageId:
          state.selectedImageId === id
            ? filtered[0]?.id || null
            : state.selectedImageId,
      };
    }),

  selectImage: (id) =>
    set({
      selectedImageId: id,
      editorState: defaultEditorState,
    }),

  clearAll: () =>
    set({
      uploadedImages: [],
      selectedImageId: null,
      editorState: defaultEditorState,
    }),

  setEditorState: (newState) =>
    set((state) => ({
      editorState: { ...state.editorState, ...newState },
    })),

  resetEditor: () =>
    set({
      editorState: defaultEditorState,
    }),
}));
