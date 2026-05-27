import { useState, useEffect } from "react";
import { supabase } from "../lib/Supabase";

interface Category {
  id: string;
  label: string;
  position: number;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editing, setEditing] = useState<Category | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const [form, setForm] = useState({
    id: "",
    label: "",
  });

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("position");

    setCategories(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCategories();
    });
  }, []);

  const openNew = () => {
    setEditing(null);

    setForm({
      id: "",
      label: "",
    });

    setError(null);
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);

    setForm({
      id: category.id,
      label: category.label,
    });

    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.id.trim() || !form.label.trim()) {
      setError("Completá todos los campos.");

      return;
    }

    setSaving(true);
    setError(null);

    if (editing) {
      await supabase
        .from("categories")
        .update({
          label: form.label.trim(),
        })
        .eq("id", editing.id);
    } else {
      await supabase.from("categories").insert({
        id: form.id.toLowerCase().trim(),

        label: form.label.trim(),

        position: categories.length,
      });
    }

    await fetchCategories();

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (category: Category) => {
    await supabase.from("categories").delete().eq("id", category.id);

    await fetchCategories();

    setConfirmDelete(null);
  };

  const moveCategory = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= categories.length) {
      return;
    }

    const a = categories[index];
    const b = categories[swapIndex];

    await Promise.all([
      supabase
        .from("categories")
        .update({
          position: b.position,
        })
        .eq("id", a.id),

      supabase
        .from("categories")
        .update({
          position: a.position,
        })
        .eq("id", b.id),
    ]);

    await fetchCategories();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>

          <p className="page-subtitle">
            {categories.length} categorías en el menú
          </p>
        </div>

        <button className="btn btn--primary" onClick={openNew}>
          + Nueva categoría
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
                    <th>ID</th>
                    <th>Nombre</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category, index) => (
                    <tr key={category.id}>
                      <td>
                        <div className="order-controls">
                          <button
                            className="order-btn"
                            onClick={() => moveCategory(index, "up")}
                            disabled={index === 0}
                            aria-label="Subir"
                          >
                            ▲
                          </button>

                          <button
                            className="order-btn"
                            onClick={() => moveCategory(index, "down")}
                            disabled={index === categories.length - 1}
                            aria-label="Bajar"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      <td className="text-hint mono">
                        {category.id}
                      </td>

                      <td className="text-strong">
                        {category.label}
                      </td>

                      <td>
                        <div className="responsive-actions">
                          <button
                            className="btn btn--ghost"
                            onClick={() => openEdit(category)}
                          >
                            Editar
                          </button>

                          <button
                            className="btn btn--danger"
                            onClick={() => setConfirmDelete(category)}
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
            {categories.map((category, index) => (
              <div key={category.id} className="item-card">
                <div className="item-card__header">
                  <div className="item-card__content">
                    <p className="item-card__title">{category.label}</p>

                    <p className="item-card__subtitle">{category.id}</p>
                  </div>
                </div>

                <div className="item-card__order">
                  <button
                    className="order-btn"
                    onClick={() => moveCategory(index, "up")}
                    disabled={index === 0}
                  >
                    ▲
                  </button>

                  <button
                    className="order-btn"
                    onClick={() => moveCategory(index, "down")}
                    disabled={index === categories.length - 1}
                  >
                    ▼
                  </button>
                </div>

                <div className="item-card__actions">
                  <button
                    className="btn btn--ghost"
                    onClick={() => openEdit(category)}
                  >
                    Editar
                  </button>

                  <button
                    className="btn btn--danger"
                    onClick={() => setConfirmDelete(category)}
                  >
                    Eliminar
                  </button>
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
              {editing ? "Editar categoría" : "Nueva categoría"}
            </h2>

            {!editing && (
              <div className="field">
                <label className="field__label">ID (sin espacios)</label>

                <input
                  className="field__input"
                  value={form.id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      id: e.target.value,
                    })
                  }
                  placeholder="hamburguesas"
                />
              </div>
            )}

            <div className="field">
              <label className="field__label">Nombre visible</label>

              <input
                className="field__input"
                value={form.label}
                onChange={(e) =>
                  setForm({
                    ...form,
                    label: e.target.value,
                  })
                }
                placeholder="Hamburguesas"
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
            <h2 className="modal__title">Eliminar categoría</h2>

            <p className="modal__text">
              ¿Eliminás la categoría{" "}
              <strong className="text-primary">{confirmDelete.label}</strong>
              ? Los productos de esta categoría quedarán sin categoría asignada.
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
