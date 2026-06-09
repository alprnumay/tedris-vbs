import React, { useState, useEffect, useCallback } from 'react';
import { DavetLayout } from '@/modules/davet/layout/DavetLayout';
import { PageHeader } from '@/modules/davet/layout/PageHeader';
import { ShowcasePost } from '@/modules/davet/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/davet-ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/davet-ui/card';
import { Badge } from '@/components/davet-ui/badge';
import { Button } from '@/components/davet-ui/button';
import { useToast } from '@/modules/davet/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/davet-ui/dialog';
import { Textarea } from '@/components/davet-ui/textarea';
import {
  approveShowcasePost,
  deleteShowcasePost,
  getAdminShowcases,
  rejectShowcasePost,
  requestRevisionShowcasePost,
  ShowcaseAuthError,
} from '@/modules/davet/utils/showcaseApi';

export default function CalismaOnayPage() {
  const [posts, setPosts] = useState<ShowcasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<ShowcasePost | null>(null);
  const [revizeNotu, setRevizeNotu] = useState('');
  const [isRevizeDialogOpen, setIsRevizeDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [islemde, setIslemde] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminShowcases();
      setPosts(data);
    } catch (err) {
      const msg =
        err instanceof ShowcaseAuthError
          ? 'Bu alan için giriş yapmanız ve yönetici yetkisine sahip olmanız gerekir.'
          : err instanceof Error
            ? err.message
            : 'Kayıtlar yüklenemedi.';
      toast({ title: 'Hata', description: msg, variant: 'destructive' });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    setIslemde(true);
    try {
      await approveShowcasePost(id);
      await loadData();
      toast({ title: 'Yayında', description: 'Çalışma yayına alındı.' });
    } catch (err) {
      toast({ title: 'Hata', description: err instanceof Error ? err.message : 'İşlem başarısız.', variant: 'destructive' });
    } finally {
      setIslemde(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;
    setIslemde(true);
    try {
      await rejectShowcasePost(selectedPost.id, revizeNotu || undefined);
      setIsRejectDialogOpen(false);
      setRevizeNotu('');
      setSelectedPost(null);
      await loadData();
      toast({ title: 'Reddedildi', description: 'Çalışma reddedildi.' });
    } catch (err) {
      toast({ title: 'Hata', description: err instanceof Error ? err.message : 'İşlem başarısız.', variant: 'destructive' });
    } finally {
      setIslemde(false);
    }
  };

  const handleRevize = async () => {
    if (!selectedPost || !revizeNotu.trim()) return;
    setIslemde(true);
    try {
      await requestRevisionShowcasePost(selectedPost.id, revizeNotu.trim());
      setIsRevizeDialogOpen(false);
      setRevizeNotu('');
      setSelectedPost(null);
      await loadData();
      toast({ title: 'Revize istendi', description: 'Kullanıcıya not iletildi.' });
    } catch (err) {
      toast({ title: 'Hata', description: err instanceof Error ? err.message : 'İşlem başarısız.', variant: 'destructive' });
    } finally {
      setIslemde(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    setIslemde(true);
    try {
      await deleteShowcasePost(id);
      await loadData();
      toast({ title: 'Silindi', description: 'Çalışma silindi.' });
    } catch (err) {
      toast({ title: 'Hata', description: err instanceof Error ? err.message : 'Silinemedi.', variant: 'destructive' });
    } finally {
      setIslemde(false);
    }
  };

  const renderPostList = (filterStatus: ShowcasePost['durum']) => {
    const filtered = posts.filter(p => p.durum === filterStatus);
    
    if (loading) {
      return <div className="text-center py-12 text-muted-foreground">Yükleniyor…</div>;
    }

    if (filtered.length === 0) {
      return <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">Bu kategoride kayıt bulunmuyor.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(post => (
          <Card key={post.id} className="flex flex-col overflow-hidden">
            <div className="h-40 bg-muted w-full relative">
              {post.fotografUrl ? (
                <img src={post.fotografUrl} alt={post.baslik} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Görsel Yok</div>
              )}
              <Badge className="absolute top-2 right-2">{post.mintika}</Badge>
            </div>
            <CardHeader className="p-4">
              <div className="text-xs text-primary font-medium">{post.kategori}</div>
              <CardTitle className="text-lg line-clamp-1">{post.baslik}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">{post.yurtAdi} - {post.hocaAdi}</div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              <p className="text-sm line-clamp-3">{post.amac}</p>
              {post.revizeNotu && filterStatus === 'revize-istendi' && (
                <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                  <strong>Revize Notu:</strong> {post.revizeNotu}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0 gap-2 flex-wrap bg-muted/20 border-t mt-auto items-center justify-between">
              {filterStatus === 'onay-bekliyor' && (
                <>
                  <Button size="sm" disabled={islemde} onClick={() => handleApprove(post.id)} className="flex-1">Yayına Al</Button>
                  <Button size="sm" variant="outline" disabled={islemde} onClick={() => { setSelectedPost(post); setRevizeNotu(''); setIsRevizeDialogOpen(true); }} className="flex-1">Revize</Button>
                  <Button size="sm" variant="destructive" disabled={islemde} onClick={() => { setSelectedPost(post); setRevizeNotu(''); setIsRejectDialogOpen(true); }} className="flex-1">Reddet</Button>
                </>
              )}
              <Button size="sm" variant="ghost" disabled={islemde} className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deletePost(post.id)}>Sil</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <PageHeader
          accent="rose"
          title="Çalışma Onayı"
          description="Onay bekleyen çalışmaları inceleyin, yayına alın veya revize isteyin."
        />

        <Tabs defaultValue="onay-bekliyor">
          <TabsList className="mb-6 bg-card border flex-wrap h-auto">
            <TabsTrigger value="onay-bekliyor">Onay Bekleyenler ({posts.filter(p => p.durum === 'onay-bekliyor').length})</TabsTrigger>
            <TabsTrigger value="yayinda">Yayındakiler ({posts.filter(p => p.durum === 'yayinda').length})</TabsTrigger>
            <TabsTrigger value="revize-istendi">Revize İstenenler ({posts.filter(p => p.durum === 'revize-istendi').length})</TabsTrigger>
            <TabsTrigger value="reddedildi">Reddedilenler ({posts.filter(p => p.durum === 'reddedildi').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="onay-bekliyor">{renderPostList('onay-bekliyor')}</TabsContent>
          <TabsContent value="yayinda">{renderPostList('yayinda')}</TabsContent>
          <TabsContent value="revize-istendi">{renderPostList('revize-istendi')}</TabsContent>
          <TabsContent value="reddedildi">{renderPostList('reddedildi')}</TabsContent>
        </Tabs>

        <Dialog open={isRevizeDialogOpen} onOpenChange={setIsRevizeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revize İste</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">Kullanıcıya neyi düzeltmesi gerektiğini açıklayın.</p>
              <Textarea 
                value={revizeNotu} 
                onChange={e => setRevizeNotu(e.target.value)} 
                placeholder="Örnek: Görsel kalitesi çok düşük, daha net bir fotoğraf yükleyebilir misiniz?"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRevizeDialogOpen(false)}>İptal</Button>
              <Button onClick={handleRevize} disabled={islemde || !revizeNotu.trim()}>Kaydet ve Gönder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reddet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">İsteğe bağlı red gerekçesi yazabilirsiniz.</p>
              <Textarea 
                value={revizeNotu} 
                onChange={e => setRevizeNotu(e.target.value)} 
                placeholder="Red gerekçesi (opsiyonel)"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>İptal</Button>
              <Button variant="destructive" onClick={handleReject} disabled={islemde}>Reddet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DavetLayout>
  );
}
