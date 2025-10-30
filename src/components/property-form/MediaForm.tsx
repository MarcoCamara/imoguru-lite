import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Star, StarOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MediaFormProps {
  propertyId?: string;
  pendingImages: File[];
  setPendingImages: (files: File[]) => void;
  pendingVideos: File[];
  setPendingVideos: (files: File[]) => void;
  formData: any;
  setFormData: (data: any) => void;
}

export default function MediaForm({ 
  propertyId, 
  pendingImages, 
  setPendingImages,
  pendingVideos,
  setPendingVideos,
  formData,
  setFormData,
}: MediaFormProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [youtubeUrlError, setYoutubeUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      loadMedia();
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  const loadMedia = async () => {
    try {
      const [imagesRes, videosRes] = await Promise.all([
        supabase
          .from('property_images')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order'),
        supabase
          .from('property_videos')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at'),
      ]);

      if (imagesRes.error) throw imagesRes.error;
      if (videosRes.error) throw videosRes.error;

      setImages(imagesRes.data || []);
      setVideos(videosRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mídia',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // If property is not saved yet, store files locally
    if (!propertyId) {
      setPendingImages([...pendingImages, ...Array.from(files)]);
      toast({
        title: 'Imagens adicionadas!',
        description: 'As imagens serão enviadas quando você salvar o imóvel.',
      });
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('property_images').insert([
          {
            property_id: propertyId,
            url: publicUrl,
            display_order: images.length,
            is_cover: images.length === 0,
          },
        ]);

        if (dbError) throw dbError;
      }

      toast({
        title: 'Imagens enviadas!',
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar imagens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // If property is not saved yet, store files locally
    if (!propertyId) {
      setPendingVideos([...pendingVideos, ...Array.from(files)]);
      toast({
        title: 'Vídeos adicionados!',
        description: 'Os vídeos serão enviados quando você salvar o imóvel.',
      });
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-videos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-videos')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('property_videos').insert([
          {
            property_id: propertyId,
            url: publicUrl,
            title: file.name,
          },
        ]);

        if (dbError) throw dbError;
      }

      toast({
        title: 'Vídeos enviados!',
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar vídeos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleCoverImage = async (imageId: string) => {
    try {
      await supabase
        .from('property_images')
        .update({ is_cover: false })
        .eq('property_id', propertyId);

      await supabase
        .from('property_images')
        .update({ is_cover: true })
        .eq('id', imageId);

      toast({
        title: 'Imagem de capa atualizada!',
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteImage = async (imageId: string, url: string) => {
    try {
      const path = url.split('/property-images/')[1];
      await supabase.storage.from('property-images').remove([path]);
      await supabase.from('property_images').delete().eq('id', imageId);

      toast({
        title: 'Imagem removida!',
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteVideo = async (videoId: string, url: string) => {
    try {
      const path = url.split('/property-videos/')[1];
      await supabase.storage.from('property-videos').remove([path]);
      await supabase.from('property_videos').delete().eq('id', videoId);

      toast({
        title: 'Vídeo removido!',
      });

      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages(pendingImages.filter((_, i) => i !== index));
  };

  const removePendingVideo = (index: number) => {
    setPendingVideos(pendingVideos.filter((_, i) => i !== index));
  };

  // Basic YouTube URL validation
  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty string
    const regex = /^(https?\:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?\:\/\/(?:www\.)?youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    return regex.test(url);
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, youtube_url: url });
    if (!isValidYouTubeUrl(url)) {
      setYoutubeUrlError('URL do YouTube inválida.');
    } else {
      setYoutubeUrlError(null);
    }
  };

  if (!propertyId) {
    return (
      <div className="space-y-6 pt-4">
        <div>
          <Label>Imagens</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>

          {pendingImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {pendingImages.map((file, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                  <CardContent className="p-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePendingImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pendingImages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma imagem adicionada ainda.
            </p>
          )}
        </div>

        <div>
          <Label>Vídeos (Upload)</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              disabled={uploading}
            />
          </div>

          {pendingVideos.length > 0 && (
            <div className="space-y-2 mt-4">
              {pendingVideos.map((file, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between p-4">
                    <p className="font-medium">{file.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePendingVideo(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pendingVideos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum vídeo adicionado ainda.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="youtube_url">URL do Vídeo (YouTube)</Label>
          <Input
            id="youtube_url"
            value={formData.youtube_url}
            onChange={handleYoutubeUrlChange}
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            className={youtubeUrlError ? 'border-red-500' : ''}
          />
          {youtubeUrlError && <p className="text-red-500 text-sm mt-1">{youtubeUrlError}</p>}
        </div>

        <p className="text-sm text-muted-foreground">
          As imagens e vídeos serão enviados quando você salvar o imóvel.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div>
        <Label>Imagens</Label>
        <div className="mt-2">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {images.map((image) => (
            <Card key={image.id} className="relative overflow-hidden">
              <img
                src={image.url}
                alt="Property"
                className="w-full h-32 object-cover"
              />
              <CardContent className="p-2 flex justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCoverImage(image.id)}
                >
                  {image.is_cover ? (
                    <Star className="h-4 w-4 fill-current" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteImage(image.id, image.url)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {images.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma imagem enviada ainda.
          </p>
        )}
      </div>

      <div>
        <Label>Vídeos (Upload)</Label>
        <div className="mt-2">
          <Input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoUpload}
            disabled={uploading}
          />
        </div>

        <div className="space-y-2 mt-4">
          {videos.map((video) => (
            <Card key={video.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{video.title}</p>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Ver vídeo
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteVideo(video.id, video.url)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {videos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum vídeo enviado ainda.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="youtube_url">URL do Vídeo (YouTube)</Label>
        <Input
          id="youtube_url"
          value={formData.youtube_url}
          onChange={handleYoutubeUrlChange}
          placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
          className={youtubeUrlError ? 'border-red-500' : ''}
        />
        {youtubeUrlError && <p className="text-red-500 text-sm mt-1">{youtubeUrlError}</p>}
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Enviando arquivos...</span>
        </div>
      )}
    </div>
  );
}
