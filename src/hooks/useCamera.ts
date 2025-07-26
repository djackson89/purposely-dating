import { useState } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';

export interface PhotoResult {
  dataUrl: string;
  webPath?: string;
  format: string;
}

export const useCamera = () => {
  const [isSupported, setIsSupported] = useState(Capacitor.isNativePlatform());
  const { toast } = useToast();

  const takePicture = async (source: CameraSource = CameraSource.Prompt): Promise<PhotoResult | null> => {
    try {
      // Check camera permissions
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera !== 'granted') {
        const requestResult = await Camera.requestPermissions();
        if (requestResult.camera !== 'granted') {
          toast({
            title: "Camera Permission Denied",
            description: "Please allow camera access to take photos.",
            variant: "destructive",
          });
          return null;
        }
      }

      // Take photo
      const photo: Photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 500,
        height: 500,
      });

      if (!photo.dataUrl) {
        throw new Error('Failed to capture photo');
      }

      return {
        dataUrl: photo.dataUrl,
        webPath: photo.webPath,
        format: photo.format,
      };

    } catch (error: any) {
      console.error('Camera error:', error);
      
      if (error.message?.includes('cancelled')) {
        // User cancelled, don't show error
        return null;
      }
      
      toast({
        title: "Camera Error",
        description: "Failed to take photo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const selectFromGallery = async (): Promise<PhotoResult | null> => {
    return takePicture(CameraSource.Photos);
  };

  const takeFromCamera = async (): Promise<PhotoResult | null> => {
    return takePicture(CameraSource.Camera);
  };

  const showPhotoOptions = async (): Promise<PhotoResult | null> => {
    return takePicture(CameraSource.Prompt);
  };

  // Web fallback for file input
  const selectFileWeb = (): Promise<PhotoResult | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            format: file.type,
          });
        };
        reader.onerror = () => {
          toast({
            title: "File Error",
            description: "Failed to read selected file.",
            variant: "destructive",
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      };

      input.click();
    });
  };

  const selectPhoto = async (): Promise<PhotoResult | null> => {
    if (isSupported) {
      return showPhotoOptions();
    } else {
      return selectFileWeb();
    }
  };

  return {
    isSupported,
    takePicture,
    selectFromGallery,
    takeFromCamera,
    showPhotoOptions,
    selectPhoto,
  };
};