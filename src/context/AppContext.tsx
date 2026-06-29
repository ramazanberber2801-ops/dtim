// Günün Ayet ve Hadisini Yılın Gününe Göre Supabase'den Çekme
  useEffect(() => {
    async function fetchDailyInspiration() {
      try {
        // Bugünün yılın kaçıncı günü olduğunu kesin hesaplayan fonksiyon
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1);
        const diff = today.getTime() - start.getTime() + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay) + 1; // 1 ile 365 arası net gün verir

        console.log("Bugün yılın şu günüdür:", dayOfYear);

        const { data, error } = await supabase
          .from('inspiration')
          .select('verse_text, verse_reference, hadith_text, hadith_source')
          .eq('day_of_year', dayOfYear)
          .single();
        
        if (!error && data) {
          setDailyData(data);
        } else if (error) {
          console.error("Supabase veri çekme hatası:", error.message);
        }
      } catch (err) {
        console.error("Ayet/Hadis yüklenirken hata oluştu:", err);
      }
    }
    fetchDailyInspiration();
  }, [now.getDate()]);
