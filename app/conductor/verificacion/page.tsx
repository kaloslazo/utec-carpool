"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Car, FileText, Settings2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";

interface FormData {
  plate: string;
  carBrand: string;
  carModel: string;
  carColor: string;
  carYear: string;
  licenseNumber: string;
  yapeQrUrl: string;
  radiusKm: string;
}

const RADIUS_OPTIONS = ["5", "10", "15", "20"];

export default function VerificacionPage() {
  const [formData, setFormData] = useState<FormData>({
    plate: "",
    carBrand: "",
    carModel: "",
    carColor: "",
    carYear: "",
    licenseNumber: "",
    yapeQrUrl: "",
    radiusKm: "10",
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [userId, setUserId] = useState<string>("");

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  function handleField(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData(prev => ({ ...prev, [key]: e.target.value }));
  }

  function handleFileChange(file: File) {
    setLicenseFile(file);
    setLicensePreview(URL.createObjectURL(file));
  }

  function clearFile() {
    setLicenseFile(null);
    setLicensePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { showToast("Sesión no encontrada.", false); return; }

    const { plate, carBrand, carModel, carColor, carYear, licenseNumber, radiusKm } = formData;
    if (!plate || !carBrand || !carModel || !carColor || !carYear || !licenseNumber) {
      showToast("Completa todos los campos obligatorios.", false);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    let licensePhotoUrl: string | null = null;

    if (licenseFile) {
      setUploading(true);
      const ext = licenseFile.name.split(".").pop();
      const path = `${userId}/license.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("licenses")
        .upload(path, licenseFile, { upsert: true });

      if (uploadError) {
        showToast("Error al subir la foto de licencia.", false);
        setUploading(false);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("licenses").getPublicUrl(path);
      licensePhotoUrl = urlData.publicUrl;
      setUploading(false);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("driver_profiles") as any).upsert({
      id: userId,
      license_number: formData.licenseNumber,
      plate: formData.plate,
      car_brand: formData.carBrand,
      car_model: formData.carModel,
      car_color: formData.carColor,
      car_year: parseInt(formData.carYear),
      yape_qr_url: formData.yapeQrUrl || null,
      search_radius_km: parseInt(radiusKm),
      preferred_routes: {},
      is_verified: false,
      license_photo_url: licensePhotoUrl || null,
    }, { onConflict: "id" });

    if (error) {
      showToast("Error al guardar el perfil de conductor.", false);
    } else {
      showToast("Datos enviados. Tu cuenta será verificada pronto.", true);
    }
    setSubmitting(false);
  }


  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0f1c2e]">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-dark">Verificación de conductor</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Completa tus datos para poder ofrecer viajes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-amber-50 px-5 py-3">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <p className="text-xs font-semibold text-amber-700">
            La verificación puede tardar hasta 24 hs hábiles.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Datos del vehículo */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
            <Car className="h-4 w-4 text-primary" />
            <p className="font-heading text-sm font-bold text-dark">Datos del vehículo</p>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-dark">
                  Placa <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="ABC-123"
                  value={formData.plate}
                  onChange={handleField("plate")}
                  className="uppercase"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-dark">
                  Año <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="2020"
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  value={formData.carYear}
                  onChange={handleField("carYear")}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-dark">
                  Marca <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Toyota"
                  value={formData.carBrand}
                  onChange={handleField("carBrand")}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-dark">
                  Modelo <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Corolla"
                  value={formData.carModel}
                  onChange={handleField("carModel")}
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-dark">
                Color <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                placeholder="Blanco"
                value={formData.carColor}
                onChange={handleField("carColor")}
                required
              />
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
            <FileText className="h-4 w-4 text-primary" />
            <p className="font-heading text-sm font-bold text-dark">Documentos</p>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-dark">
                N° de licencia <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                placeholder="Q12345678"
                value={formData.licenseNumber}
                onChange={handleField("licenseNumber")}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-dark">
                Foto de licencia
              </label>
              {uploading ? (
                <div className="flex h-20 items-center justify-center rounded-xl border border-border bg-white">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <FileUpload
                  accept="image/*,.pdf"
                  label="Subir foto de licencia"
                  hint="JPG, PNG o PDF — máx. 5 MB"
                  preview={licensePreview}
                  fileName={licenseFile?.name}
                  onChange={handleFileChange}
                  onClear={clearFile}
                />
              )}
            </div>
          </div>
        </div>

        {/* Preferencias */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
            <Settings2 className="h-4 w-4 text-primary" />
            <p className="font-heading text-sm font-bold text-dark">Preferencias</p>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-xs font-semibold text-dark">
                Radio de búsqueda de pasajeros
              </label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, radiusKm: r }))}
                    className={cn(
                      "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all",
                      formData.radiusKm === r
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface text-muted-foreground hover:bg-primary/10"
                    )}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-dark">
                URL de tu QR de Yape
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={formData.yapeQrUrl}
                onChange={handleField("yapeQrUrl")}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Opcional — los pasajeros usarán esto para pagarte.
              </p>
            </div>
          </div>

          <div className="border-t border-border px-5 py-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f1c2e] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#1a2f4a] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? "Subiendo archivos..." : "Guardando..."}
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Enviar para verificación
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {toast && (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg lg:bottom-6",
            toast.ok ? "bg-green-500" : "bg-red-500"
          )}
        >
          {toast.ok
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
