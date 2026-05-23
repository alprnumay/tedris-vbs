import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import {
  epostaUret,
  epostaAlternatif,
  kurumKoduUret,
  sifreUret,
  ilTahminEt,
  girisBilgisiMetni,
  BILINEN_MINTIKALAR,
} from "../../lib/admin/adminKullaniciUret";
import { ROL_LABEL, rolAciklama, type AdminRol } from "../../lib/admin/adminRol";
import { inputStyle, labelStyle, selectStyle } from "./adminUi";

export interface OlusturulanKullanici {
  name: string;
  email: string;
  password: string;
  mintika: string;
  kurum: string;
  il: string;
  institutionCode: string;
  role: AdminRol;
}

interface Props {
  mevcutEpostalar: string[];
  onOlusturuldu: () => void;
}

function OnizlemeSatir({ label, value, uyar }: { label: string; value: string; uyar?: string }) {
  return (
    <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>{value || "—"}</div>
      {uyar && <div style={{ fontSize: 10, color: "#b45309", marginTop: 4 }}>{uyar}</div>}
    </div>
  );
}

export function AdminKullaniciForm({ mevcutEpostalar, onOlusturuldu }: Props) {
  const [name, setName] = useState("");
  const [mintika, setMintika] = useState("");
  const [kurum, setKurum] = useState("");
  const [role, setRole] = useState<AdminRol>("user");
  const [gelismis, setGelismis] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [il, setIl] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState<OlusturulanKullanici | null>(null);

  const otomatik = useMemo(() => {
    const ilOto = ilTahminEt(mintika) || il;
    const emailOto = epostaUret(mintika, kurum);
    const kodOto = kurumKoduUret(mintika, kurum);
    const { sifre, uyar } = sifreUret(mintika);
    let emailFinal = emailOto;
    let emailUyar: string | undefined;
    if (emailOto && mevcutEpostalar.includes(emailOto)) {
      emailFinal = epostaAlternatif(mintika, kurum, 2);
      emailUyar = "Bu e-posta kayıtlıydı; sonuna 2 eklendi.";
    }
    return {
      email: gelismis && email ? email : emailFinal,
      password: gelismis && password ? password : sifre,
      institutionCode: gelismis && institutionCode ? institutionCode : kodOto,
      province: gelismis && il ? il : ilOto,
      sifreUyar: uyar,
      emailUyar,
    };
  }, [mintika, kurum, il, gelismis, email, password, institutionCode, mevcutEpostalar]);

  const kaydet = async () => {
    setHata(null);
    if (!name.trim() || !mintika.trim() || !kurum.trim()) {
      setHata("Ad soyad, mıntıka ve kurum zorunludur.");
      return;
    }
    if (!otomatik.email) {
      setHata("E-posta üretilemedi. Mıntıka ve kurum adını kontrol edin.");
      return;
    }
    setYukleniyor(true);
    try {
      await api.adminKullaniciOlustur({
        name: name.trim(),
        email: otomatik.email,
        password: otomatik.password,
        province: otomatik.province,
        district: mintika.trim(),
        institutionName: kurum.trim(),
        institutionCode: otomatik.institutionCode,
        role,
        isActive: true,
        isAdmin: role === "admin",
      });
      setBasarili({
        name: name.trim(),
        email: otomatik.email,
        password: otomatik.password,
        mintika: mintika.trim(),
        kurum: kurum.trim(),
        il: otomatik.province,
        institutionCode: otomatik.institutionCode,
        role,
      });
      setName("");
      setMintika("");
      setKurum("");
      setRole("user");
      setGelismis(false);
      onOlusturuldu();
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Kullanıcı oluşturulamadı.");
    } finally {
      setYukleniyor(false);
    }
  };

  const kopyalaGiris = () => {
    if (!basarili) return;
    void navigator.clipboard.writeText(
      girisBilgisiMetni({
        ...basarili,
        rol: ROL_LABEL[basarili.role],
      }),
    );
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Hızlı kullanıcı oluştur</div>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>
        Mıntıka ve kurum yazın; e-posta, şifre ve kurum kodu otomatik hazırlanır.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        <div>
          <label style={labelStyle}>Ad Soyad</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alanya Ferah Kullanıcı" />
        </div>
        <div>
          <label style={labelStyle}>Mıntıka / İlçe</label>
          <input style={inputStyle} list="mintika-list" value={mintika} onChange={(e) => { setMintika(e.target.value); setIl(ilTahminEt(e.target.value)); }} placeholder="Alanya" />
          <datalist id="mintika-list">
            {BILINEN_MINTIKALAR.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
        <div>
          <label style={labelStyle}>Kurum / Yurt</label>
          <input style={inputStyle} value={kurum} onChange={(e) => setKurum(e.target.value)} placeholder="Ferah" />
        </div>
        <div>
          <label style={labelStyle}>Rol</label>
          <select style={selectStyle} value={role} onChange={(e) => setRole(e.target.value as AdminRol)}>
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
          </select>
          <p style={{ fontSize: 10, color: "#94a3b8", margin: "4px 0 0" }}>{rolAciklama(role)}</p>
        </div>
      </div>

      {!gelismis ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginTop: 12 }}>
          <OnizlemeSatir label="E-posta" value={otomatik.email} uyar={otomatik.emailUyar} />
          <OnizlemeSatir label="Geçici şifre" value={otomatik.password} uyar={otomatik.sifreUyar} />
          <OnizlemeSatir label="Kurum kodu" value={otomatik.institutionCode} />
          <OnizlemeSatir label="İl" value={otomatik.province} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginTop: 12 }}>
          <div><label style={labelStyle}>E-posta</label><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label style={labelStyle}>Geçici şifre</label><input style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><label style={labelStyle}>Kurum kodu</label><input style={inputStyle} value={institutionCode} onChange={(e) => setInstitutionCode(e.target.value)} /></div>
          <div><label style={labelStyle}>İl</label><input style={inputStyle} value={il} onChange={(e) => setIl(e.target.value)} /></div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        <button type="button" onClick={kaydet} disabled={yukleniyor}
          style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: yukleniyor ? 0.7 : 1 }}>
          {yukleniyor ? "Oluşturuluyor…" : "Kullanıcı oluştur"}
        </button>
        <button type="button" onClick={() => setGelismis((g) => !g)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          {gelismis ? "Otomatik önizleme" : "Gelişmiş düzenle"}
        </button>
      </div>

      {hata && <p style={{ fontSize: 12, color: "#991b1b", marginTop: 10, fontWeight: 600 }}>{hata}</p>}

      {basarili && (
        <div style={{ marginTop: 14, padding: 14, background: "#ecfdf5", borderRadius: 10, border: "1px solid #86efac" }}>
          <div style={{ fontWeight: 800, color: "#166534", marginBottom: 8 }}>Kullanıcı oluşturuldu</div>
          <div style={{ fontSize: 12, color: "#14532d", lineHeight: 1.6 }}>
            <div><strong>Ad:</strong> {basarili.name}</div>
            <div><strong>E-posta:</strong> {basarili.email}</div>
            <div><strong>Şifre:</strong> {basarili.password}</div>
            <div><strong>Kurum:</strong> {basarili.kurum} · {basarili.mintika}</div>
            <div><strong>Rol:</strong> {ROL_LABEL[basarili.role]}</div>
          </div>
          <button type="button" onClick={kopyalaGiris}
            style={{ marginTop: 10, padding: "8px 14px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Giriş bilgilerini kopyala
          </button>
        </div>
      )}
    </div>
  );
}
