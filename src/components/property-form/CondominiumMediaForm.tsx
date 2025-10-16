import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CondominiumMediaFormProps {
  propertyId?: string;
}

export default function CondominiumMediaForm({ propertyId }: CondominiumMediaFormProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [videoLink, setVideoLink] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  useEffect(() => {
    if (propertyId) {
      loadMedia();
    }
  }, [propertyId]);

  const loadMedia = async () => {
    try {
      // Carregar imagens do condomínio
      const { data: imagesData, error: imagesError } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .eq('caption', 'condominium')
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;
      setImages(imagesData || []);

      // Carregar vídeos do condomínio
      const { data: videosData, error: videosError } = await supabase
        .from('property_videos')
        .select('*')
        .eq('property_id', propertyId)
        .ilike('title', 'condominium:%')
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;
      setVideos(videosData || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mídia',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!propertyId) {
      toast({
        title: 'Atenção',
        description: 'Salve o imóvel antes de adicionar imagens do condomínio',
        variant: 'destructive',
      });
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/condominium/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            url: publicUrl,
            caption: 'condominium',
            display_order: images.length,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: 'Sucesso!',
        description: 'Imagens do condomínio adicionadas',
      });
      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      const filePath = imageUrl.split('/property-images/')[1];
      if (filePath) {
        await supabase.storage
          .from('property-images')
          .remove([filePath]);
      }

      toast({
        title: 'Imagem removida',
      });
      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover imagem',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddVideoLink = async () => {
    if (!propertyId) {
      toast({
        title: 'Atenção',
        description: 'Salve o imóvel antes de adicionar vídeos do condomínio',
        variant: 'destructive',
      });
      return;
    }

    if (!videoLink) {
      toast({
        title: 'Atenção',
        description: 'Digite o link do vídeo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('property_videos')
        .insert({
          property_id: propertyId,
          url: videoLink,
          title: `condominium: ${videoTitle || 'Vídeo do Condomínio'}`,
        });

      if (error) throw error;

      toast({
        title: 'Vídeo adicionado!',
      });
      setVideoLink('');
      setVideoTitle('');
      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar vídeo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('property_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: 'Vídeo removido',
      });
      loadMedia();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover vídeo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Imagens do Condomínio</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="condo-images">Adicionar Imagens</Label>
            <Input
              id="condo-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || !propertyId}
            />
            {!propertyId && (
              <p className="text-sm text-muted-foreground mt-1">
                Salve o imóvel primeiro para adicionar imagens
              </p>
            )}
          </div>

          {uploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Fazendo upload...</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt="Condomínio"
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(image.id, image.url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Vídeos do Condomínio</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="video-link">Link do Vídeo (YouTube, Vimeo, etc)</Label>
              <Input
                id="video-link"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={!propertyId}
              />
            </div>
            <div>
              <Label htmlFor="video-title">Título (opcional)</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Descrição do vídeo"
                disabled={!propertyId}
              />
            </div>
          </div>

          <Button onClick={handleAddVideoLink} disabled={!propertyId || !videoLink}>
            <Upload className="h-4 w-4 mr-2" />
            Adicionar Vídeo
          </Button>

          {!propertyId && (
            <p className="text-sm text-muted-foreground">
              Salve o imóvel primeiro para adicionar vídeos
            </p>
          )}

          <div className="space-y-2">
            {videos.map((video) => (
              <Card key={video.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                  >
                    {video.title?.replace('condominium: ', '')}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteVideo(video.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
