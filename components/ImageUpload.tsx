"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  existingImageUrl?: string;
  label?: string;
}

export default function ImageUpload({ 
  onImageUploaded, 
  existingImageUrl,
  label = "Upload Image" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const MAX_FILE_SIZE = 500 * 1024; // 500KB
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 500KB limit (${(file.size / 1024).toFixed(1)}KB)`);
      return;
    }
    
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, GIF and WebP images are allowed");
      return;
    }
    
    setError(null);
    setIsUploading(true);
    
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `quiz-images/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase
        .storage
        .from('quiz-assets')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('quiz-assets')
        .getPublicUrl(filePath);
      
      // Set preview and notify parent
      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{label}</p>
        {previewUrl && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={handleRemoveImage}
            className="text-red-400 hover:text-red-500 h-auto py-1 px-2"
          >
            Remove
          </Button>
        )}
      </div>
      
      {previewUrl ? (
        <div className="relative border border-gray-700 rounded-md overflow-hidden h-40 bg-gray-800 flex items-center justify-center">
          <Image 
            src={previewUrl} 
            alt="Preview" 
            fill
            style={{objectFit: "contain"}} 
            className="max-h-full max-w-full"
          />
        </div>
      ) : (
        <div className="border border-dashed border-gray-600 rounded-md p-6 text-center bg-gray-900/50">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            id="image-upload"
            className="hidden"
            disabled={isUploading}
          />
          <label 
            htmlFor="image-upload" 
            className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            {isUploading ? "Uploading..." : "Click to upload (max 500KB)"}
          </label>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Supported formats: JPEG, PNG, GIF, WebP (max 500KB)
      </p>
    </div>
  );
} 