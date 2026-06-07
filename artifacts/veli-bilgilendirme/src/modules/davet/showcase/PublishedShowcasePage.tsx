import React, { useState, useEffect, useCallback } from 'react';
import { DavetLayout } from '@/modules/davet/layout/DavetLayout';
import { ShowcasePost } from '@/modules/davet/types';
import { Card, CardContent, CardFooter } from '@/components/davet-ui/card';
import { Badge } from '@/components/davet-ui/badge';
import { Button } from '@/components/davet-ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/davet-ui/dialog';
import { Share2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/davet-ui/select';
import { Input } from '@/components/davet-ui/input';
import { getPublishedShowcases, ShowcaseAuthError } from '@/modules/davet/utils/showcaseApi';

export default function PublishedShowcasePage() {
  const [showcases, setShowcases] = useState<ShowcasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ShowcasePost | null>(null);
  const [filterMintika, setFilterMintika] = useState('Hepsi');
  const [filterKategori, setFilterKategori] = useState('Hepsi');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('En Yeni');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getPublishedShowcases();
      setShowcases(data);
    } catch (err) {
      if (err instanceof ShowcaseAuthError) {
        setLoadError('Yayındaki çalışmaları görmek için giriş yapmanız gerekiyor.');
      } else {
        setLoadError(err instanceof Error ? err.message : 'Veriler yüklenemedi.');
      }
      setShowcases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShare = (post: ShowcasePost) => {
    const text = `Göz Atın: ${post.baslik}\n${post.yurtAdi}\n\nDetaylar Tedris Davet platformunda.`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.baslik, text, url }).catch(console.error);
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    }
  };

  const mintikalar = ['Hepsi', ...Array.from(new Set(showcases.map(s => s.mintika).filter(Boolean)))];
  const kategoriler = ['Hepsi', ...Array.from(new Set(showcases.map(s => s.kategori)))];

  let filtered = showcases
    .filter(s => filterMintika === 'Hepsi' || s.mintika === filterMintika)
    .filter(s => filterKategori === 'Hepsi' || s.kategori === filterKategori)
    .filter(s => s.baslik.toLowerCase().includes(searchQuery.toLowerCase()) || s.amac.toLowerCase().includes(searchQuery.toLowerCase()) || (s.otomatikMetin ?? '').toLowerCase().includes(searchQuery.toLowerCase()));

  if (sortOrder === 'En Yeni') {
    filtered = filtered.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
  } else if (sortOrder === 'Kategoriye Göre') {
    filtered = filtered.sort((a, b) => a.kategori.localeCompare(b.kategori));
  } else if (sortOrder === 'Mıntıkaya Göre') {
    filtered = filtered.sort((a, b) => a.mintika.localeCompare(b.mintika));
  }

  const ozetMetin = (post: ShowcasePost) => post.otomatikMetin || post.amac;

  return (
    <DavetLayout>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold">Yayındaki Çalışmalar</h1>
          <p className="text-muted-foreground mt-1">Diğer kurumların başarılı uygulamalarını inceleyin, ilham alın.</p>
        </div>

        {loadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {loadError}
            <Button variant="outline" size="sm" className="ml-4" onClick={loadData}>Tekrar dene</Button>
          </div>
        )}

        <div className="bg-card p-4 rounded-lg border flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full flex-1">
            <Input 
              placeholder="Ara..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-[250px]"
            />
            <Select value={filterMintika} onValueChange={setFilterMintika}>
              <SelectTrigger className="md:max-w-[200px]"><SelectValue placeholder="Mıntıka" /></SelectTrigger>
              <SelectContent>
                {mintikalar.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="md:max-w-[200px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                {kategoriler.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-auto min-w-[200px]">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger><SelectValue placeholder="Sıralama" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="En Yeni">En Yeni</SelectItem>
                <SelectItem value="Kategoriye Göre">Kategoriye Göre</SelectItem>
                <SelectItem value="Mıntıkaya Göre">Mıntıkaya Göre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Yükleniyor…</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden hover:shadow-md transition-all border-border group h-full">
              <div className="h-48 w-full bg-muted relative overflow-hidden">
                {post.fotografUrl ? (
                  <img src={post.fotografUrl} alt={post.baslik} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">Görsel Yok</div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">{post.kategori}</Badge>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">{post.baslik}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{ozetMetin(post)}</p>
                <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{post.yurtAdi}</span>
                    <span className="text-xs">{post.mintika}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button className="w-full" variant="outline" onClick={() => setSelectedPost(post)}>
                  Detayları Gör
                </Button>
              </CardFooter>
            </Card>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full py-16 text-center bg-card border rounded-lg">
              <p className="text-lg text-muted-foreground">
                {showcases.length === 0
                  ? 'Henüz yayına alınmış çalışma bulunmuyor.'
                  : 'Filtrelere uygun çalışma bulunamadı.'}
              </p>
              {showcases.length > 0 && (
                <Button variant="outline" className="mt-4" onClick={() => { setFilterMintika('Hepsi'); setFilterKategori('Hepsi'); setSearchQuery(''); }}>Filtreleri Temizle</Button>
              )}
            </div>
          )}
        </div>
        )}

        <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            {selectedPost && (
              <div className="flex flex-col">
                {selectedPost.fotografUrl && (
                  <div className="w-full h-64 md:h-80 bg-muted relative">
                    <img src={selectedPost.fotografUrl} alt={selectedPost.baslik} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 md:p-8 space-y-8">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex gap-2">
                        <Badge>{selectedPost.kategori}</Badge>
                        <Badge variant="outline">{selectedPost.mintika}</Badge>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleShare(selectedPost)}>
                        <Share2 className="w-4 h-4 mr-2" /> WhatsApp'ta Paylaş
                      </Button>
                    </div>
                    <DialogHeader>
                      <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight">{selectedPost.baslik}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 text-muted-foreground border-b pb-4">
                      <div className="font-medium text-foreground text-lg">{selectedPost.yurtAdi}</div>
                      <div className="text-sm">Paylaşan: {selectedPost.hocaAdi}</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Amaç</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedPost.amac}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Uygulama Süreci</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedPost.talebelerNeYapti}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Uygulama Yöntemi</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedPost.uygulamaYontemi}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Kazanımlar</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedPost.kazanim}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Sonuç & Gözlemler</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedPost.sonuc}</p>
                    </div>
                    <div className="bg-muted/50 p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-2 text-foreground">Diğer Yurtlara Öneriler</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedPost.digerYurtlarNasil}</p>
                    </div>
                  </div>

                  {selectedPost.etiketler && selectedPost.etiketler.length > 0 && (
                    <div className="pt-4 border-t flex flex-wrap gap-2">
                      {selectedPost.etiketler.map(tag => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DavetLayout>
  );
}
