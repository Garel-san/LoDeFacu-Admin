import { useState, useEffect } from "react";
import { supabase } from "../lib/Supabase";

interface DeliveryZone {
  id: number;
  label: string;
  price: number;
  position: number;
}

export function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<DeliveryZone | null>(null);

  const [form, setForm] = useState({
    label: "",
    price: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = async () => {
    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .order("position");

    setZones(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchZones();
    });
  }, []);

  const openNew = () => {
    setEditing(null);

    setForm({
      label: "",
      price: "",
    });

    setError(null);
    setShowModal(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone);

    setForm({
      label: zone.label,
      price: String(zone.price),
    });

    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.price) {
      setError("Completá todos los campos.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      label: form.label.trim(),
      price: parseInt(form.price),
    };

    if (editing) {
      await supabase
        .from("delivery_zones")
        .update(payload)
        .eq("id", editing.id);
    } else {
      await supabase.from("delivery_zones").insert({
        ...payload,
        position: zones.length,
      });
    }

    await fetchZones();

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (zone: DeliveryZone) => {
    await supabase.from("delivery_zones").delete().eq("id", zone.id);

    await fetchZones();
    setConfirmDelete(null);
  };

  const moveZone = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= zones.length) {
      return;
    }

    const a = zones[index];
    const b = zones[swapIndex];

    await Promise.all([
      supabase
        .from("delivery_zones")
        .update({ position: b.position })
        .eq("id", a.id),

      supabase
        .from("delivery_zones")
        .update({ position: a.position })
        .eq("id", b.id),
    ]);

    await fetchZones();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Zonas de delivery</h1>

          <p className="page-subtitle">{zones.length} zonas configuradas</p>
        </div>

        <button className="btn btn--primary" onClick={openNew}>
          + Nueva zona
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card table-card desktop-only">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Zona</th>
                    <th>Costo delivery</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {zones.map((zone, index) => (
                    <tr key={zone.id}>
                      <td>
                        <div className="order-controls">
                          <button
                            className="order-btn"
                            onClick={() => moveZone(index, "up")}
                            disabled={index === 0}
                            aria-label="Subir"
                          >
                            ▲
                          </button>

                          <button
                            className="order-btn"
                            onClick={() => moveZone(index, "down")}
                            disabled={index === zones.length - 1}
                            aria-label="Bajar"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      <td className="text-strong">{zone.label}</td>

                      <td className="text-strong text-accent">
                        ${zone.price.toLocaleString("es-AR")}
                      </td>

                      <td>
                        <div className="responsive-actions">
                          <button
                            className="btn btn--ghost"
                            onClick={() => openEdit(zone)}
                          >
                            Editar
                          </button>

                          <button
                            className="btn btn--danger"
                            onClick={() => setConfirmDelete(zone)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="mobile-only item-list">
            {zones.map((zone, index) => (
              <div key={zone.id} className="item-card">
                {/* Info */}
                <div className="item-card__header">
                  <div className="item-card__content">
                    <p className="item-card__title">{zone.label}</p>
                    <div className="item-card__meta">
                      <div className="item-card__zone-price">
                        <span className="item-card__zone-price__label">
                          Costo de envío
                        </span>
                        <span className="item-card__price">
                          ${zone.price.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="item-card__divider" />

                {/* Footer: orden + acciones */}
                <div className="item-card__footer">
                  <div className="item-card__order">
                    <button
                      className="order-btn"
                      onClick={() => moveZone(index, "up")}
                      disabled={index === 0}
                      title="Subir"
                    >
                      ▲
                    </button>
                    <button
                      className="order-btn"
                      onClick={() => moveZone(index, "down")}
                      disabled={index === zones.length - 1}
                      title="Bajar"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="item-card__actions">
                    <button
                      className="btn btn--ghost item-card__btn-edit"
                      onClick={() => openEdit(zone)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn item-card__btn-delete"
                      onClick={() => setConfirmDelete(zone)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal crear / editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">
              {editing ? "Editar zona" : "Nueva zona"}
            </h2>

            <div className="field">
              <label className="field__label">Nombre de la zona</label>

              <input
                className="field__input"
                value={form.label}
                onChange={(e) =>
                  setForm({
                    ...form,
                    label: e.target.value,
                  })
                }
                placeholder="Centro"
              />
            </div>

            <div className="field">
              <label className="field__label">Costo del delivery</label>

              <input
                className="field__input"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
                placeholder="800"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal__actions">
              <button
                className="btn btn--ghost"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>

              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Eliminar zona</h2>

            <p className="modal__text">
              ¿Eliminás la zona{" "}
              <strong className="text-primary">{confirmDelete.label}</strong>?
            </p>

            <div className="modal__actions">
              <button
                className="btn btn--ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>

              <button
                className="btn btn--danger"
                onClick={() => handleDelete(confirmDelete)}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
