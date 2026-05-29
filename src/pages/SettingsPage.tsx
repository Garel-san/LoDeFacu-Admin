import { useState, useEffect } from "react";
import { supabase } from "../lib/Supabase";

interface StoreConfig {
  name: string;
  whatsapp: string;
  address: string;
  delivery_open_time: string;
  delivery_close_time: string;
  delivery_available: boolean;
  promo_active: boolean;
  promo_label: string;
  promo_title: string;
  promo_price: number;
  promo_original_price: number;
}

export function SettingsPage() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("store_config")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);

    await supabase.from("store_config").update(config).eq("id", 1);

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const set = (key: keyof StoreConfig, value: unknown) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (loading || !config) {
    return <p className="text-muted">Cargando...</p>;
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Datos del local y horarios</p>
        </div>

        {/* Guardar — solo visible en desktop en el header */}
        <button
          className="btn btn--primary desktop-only"
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="content-stack content-stack--narrow">
        {/* Datos del local */}
        <div className="card card-stack">
          <div>
            <h2 className="card-title">Datos del local</h2>
            <p className="card-subtitle">
              Información principal visible para los clientes.
            </p>
          </div>

          <div className="field">
            <label className="field__label">Nombre del local</label>
            <input
              className="field__input"
              value={config.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Lo de Facu"
            />
          </div>

          <div className="field">
            <label className="field__label">
              WhatsApp (formato: 541122334455)
            </label>
            <input
              className="field__input"
              value={config.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="541122334455"
            />
          </div>

          <div className="field">
            <label className="field__label">Dirección</label>
            <input
              className="field__input"
              value={config.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Av. Siempre Viva 123"
            />
          </div>
        </div>

        {/* Delivery */}
        <div className="card card-stack">
          <div className="card-header">
            <div>
              <h2 className="card-title">Delivery</h2>
              <p className="card-subtitle">
                Controlá horarios y disponibilidad.
              </p>
            </div>

            {/* Toggle con etiqueta de estado */}
            <div className="settings-toggle-wrap">
              <span className="settings-toggle-wrap__label">
                {config.delivery_available ? "Activo" : "Inactivo"}
              </span>
              <label className="toggle">
                <input
                  type="checkbox"
                  className="toggle__input"
                  checked={config.delivery_available}
                  onChange={(e) => set("delivery_available", e.target.checked)}
                />
                <span className="toggle__slider" />
              </label>
            </div>
          </div>

          <div className="responsive-grid">
            <div className="field">
              <label className="field__label">Horario de apertura</label>
              <input
                className="field__input field__input--time"
                type="time"
                value={config.delivery_open_time}
                onChange={(e) => set("delivery_open_time", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label">Horario de cierre</label>
              <input
                className="field__input field__input--time"
                type="time"
                value={config.delivery_close_time}
                onChange={(e) => set("delivery_close_time", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Promo */}
        <div className="card card-stack">
          <div className="card-header">
            <div>
              <h2 className="card-title">Promo del día</h2>
              <p className="card-subtitle">
                Configuración destacada para el catálogo.
              </p>
            </div>

            {/* Toggle con etiqueta de estado */}
            <div className="settings-toggle-wrap">
              <span className="settings-toggle-wrap__label">
                {config.promo_active ? "Activa" : "Inactiva"}
              </span>
              <label className="toggle">
                <input
                  type="checkbox"
                  className="toggle__input"
                  checked={config.promo_active}
                  onChange={(e) => set("promo_active", e.target.checked)}
                />
                <span className="toggle__slider" />
              </label>
            </div>
          </div>

          <div className="field">
            <label className="field__label">Título de la promo</label>
            <input
              className="field__input"
              value={config.promo_title}
              onChange={(e) => set("promo_title", e.target.value)}
              placeholder="Hamburguesa + Papas"
            />
          </div>

          <div className="responsive-grid">
            <div className="field">
              <label className="field__label">Precio promocional</label>
              <input
                className="field__input"
                type="number"
                value={config.promo_price}
                onChange={(e) => set("promo_price", parseInt(e.target.value))}
                placeholder="8500"
              />
            </div>

            <div className="field">
              <label className="field__label">Precio original</label>
              <input
                className="field__input"
                type="number"
                value={config.promo_original_price}
                onChange={(e) =>
                  set("promo_original_price", parseInt(e.target.value))
                }
                placeholder="12000"
              />
            </div>
          </div>
        </div>

        {/* Guardar — al final, solo visible en mobile */}
        <button
          className="btn btn--primary mobile-only"
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%" }}
        >
          {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
