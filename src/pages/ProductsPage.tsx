import { useState, useEffect } from "react";
import { supabase } from "../lib/Supabase";

interface Category {
  id: string;
  label: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  available: boolean;
  badge: "popular" | "nuevo" | null;
  position: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  available: true,
  badge: "" as string,
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("position"),

      supabase.from("categories").select("*").order("position"),
    ]);

    setProducts(prods ?? []);
    setCategories(cats ?? []);

    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAll();
    });
  }, []);

  const openNew = () => {
    setEditing(null);

    setForm(EMPTY_FORM);

    setImageFile(null);

    setPreviewUrl(null);

    setError(null);

    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);

    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      category_id: p.category_id,
      image_url: p.image_url,
      available: p.available,
      badge: p.badge ?? "",
    });

    setImageFile(null);

    setPreviewUrl(null);

    setError(null);

    setShowModal(true);
  };

  const processImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      const url = URL.createObjectURL(file);

      img.onload = () => {
        const MAX = 800;

        let { width, height } = img;

        if (width > height) {
          if (width > MAX) {
            height = Math.round((height * MAX) / width);

            width = MAX;
          }
        } else {
          if (height > MAX) {
            width = Math.round((width * MAX) / height);

            height = MAX;
          }
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;

        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas error"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);

            if (blob) resolve(blob);
            else reject(new Error("Conversion error"));
          },
          "image/webp",
          0.75,
        );
      };

      img.onerror = () => reject(new Error("Image load error"));

      img.src = url;
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const blob = await processImage(file);

    const filename = `${Date.now()}.webp`;

    const { error } = await supabase.storage
      .from("products")
      .upload(filename, blob, {
        upsert: true,
        contentType: "image/webp",
      });

    if (error) return null;

    const { data } = supabase.storage.from("products").getPublicUrl(filename);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.category_id) {
      setError("Nombre, precio y categoría son obligatorios.");

      return;
    }

    setSaving(true);

    setError(null);

    let image_url = form.image_url;

    if (imageFile) {
      const url = await uploadImage(imageFile);

      if (!url) {
        setError("Error al subir la imagen.");

        setSaving(false);

        return;
      }

      image_url = url;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseInt(form.price),
      category_id: form.category_id,
      image_url,
      available: form.available,
      badge: form.badge || null,
      position: editing?.position ?? products.length,
    };

    if (editing) {
      await supabase.from("products").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("products").insert(payload);
    }

    await fetchAll();

    setSaving(false);

    setShowModal(false);
  };

  const toggleAvailable = async (p: Product) => {
    await supabase
      .from("products")
      .update({
        available: !p.available,
      })
      .eq("id", p.id);

    await fetchAll();
  };

  const handleDelete = async (product: Product) => {
    if (product.image_url) {
      const filename = product.image_url.split("/").pop();

      if (filename) {
        await supabase.storage.from("products").remove([filename]);
      }
    }

    await supabase.from("products").delete().eq("id", product.id);

    await fetchAll();

    setConfirmDelete(null);
  };

  const catLabel = (id: string) =>
    categories.find((c) => c.id === id)?.label ?? id;

  const moveProduct = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= products.length) {
      return;
    }

    const a = products[index];

    const b = products[swapIndex];

    await Promise.all([
      supabase
        .from("products")
        .update({
          position: b.position,
        })
        .eq("id", a.id),

      supabase
        .from("products")
        .update({
          position: a.position,
        })
        .eq("id", b.id),
    ]);

    await fetchAll();
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>

          <p className="page-subtitle">
            {products.length} productos en el menú
          </p>
        </div>

        <button className="btn btn--primary" onClick={openNew}>
          + Nuevo producto
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <>
          {/* Desktop */}
          <div className="card table-card desktop-only">
            <div className="table-wrapper">
              <table className="table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Disponible</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {products.map((p, index) => (
                  <tr key={p.id}>
                    <td>
                      <div className="order-controls">
                        <button
                          className="order-btn"
                          onClick={() => moveProduct(index, "up")}
                          disabled={index === 0}
                        >
                          ▲
                        </button>

                        <button
                          className="order-btn"
                          onClick={() => moveProduct(index, "down")}
                          disabled={index === products.length - 1}
                        >
                          ▼
                        </button>
                      </div>
                    </td>

                    <td>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="table-image"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="table-image table-image--placeholder">
                          🍽
                        </div>
                      )}
                    </td>

                    <td>
                      <p className="table-item-name">{p.name}</p>

                      {p.badge && (
                        <span className="table-badge">{p.badge}</span>
                      )}
                    </td>

                    <td className="text-muted">{catLabel(p.category_id)}</td>

                    <td className="text-strong">
                      ${p.price.toLocaleString("es-AR")}
                    </td>

                    <td>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          className="toggle__input"
                          checked={p.available}
                          onChange={() => toggleAvailable(p)}
                        />

                        <span className="toggle__slider" />
                      </label>
                    </td>

                    <td>
                      <div className="responsive-actions">
                        <button
                          className="btn btn--ghost"
                          onClick={() => openEdit(p)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn btn--danger"
                          onClick={() => setConfirmDelete(p)}
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

          {/* Mobile */}
          <div className="mobile-only item-list">
            {products.map((p, index) => (
              <div className="item-card" key={p.id}>
                <div className="item-card__header">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="item-card__image"
                    />
                  ) : (
                    <div className="item-card__image">🍽</div>
                  )}

                  <div className="item-card__content">
                    <div className="item-card__topline">
                      <div>
                        <p className="item-card__title">{p.name}</p>

                        <p className="item-card__subtitle">
                          {catLabel(p.category_id)}
                        </p>
                      </div>

                      <label className="toggle">
                        <input
                          type="checkbox"
                          className="toggle__input"
                          checked={p.available}
                          onChange={() => toggleAvailable(p)}
                        />

                        <span className="toggle__slider" />
                      </label>
                    </div>

                    <div className="item-card__meta">
                      <span className="item-card__price">
                        ${p.price.toLocaleString("es-AR")}
                      </span>

                      {p.badge && (
                        <span className="status-badge status-badge--active">
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="item-card__order">
                  <button
                    className="order-btn"
                    onClick={() => moveProduct(index, "up")}
                    disabled={index === 0}
                  >
                    ▲
                  </button>

                  <button
                    className="order-btn"
                    onClick={() => moveProduct(index, "down")}
                    disabled={index === products.length - 1}
                  >
                    ▼
                  </button>
                </div>

                <div className="item-card__actions">
                  <button
                    className="btn btn--ghost"
                    onClick={() => openEdit(p)}
                  >
                    Editar
                  </button>

                  <button
                    className="btn btn--danger"
                    onClick={() => setConfirmDelete(p)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">
              {editing ? "Editar producto" : "Nuevo producto"}
            </h2>

            <div className="field">
              <label className="field__label">Nombre</label>

              <input
                className="field__input"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="Hamburguesa Completa"
              />
            </div>

            <div className="field">
              <label className="field__label">Descripción</label>

              <textarea
                className="field__textarea"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Carne, lechuga, tomate..."
              />
            </div>

            <div className="field">
              <label className="field__label">Precio</label>

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
                placeholder="6500"
              />
            </div>

            <div className="field">
              <label className="field__label">Categoría</label>

              <select
                className="field__select"
                value={form.category_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value,
                  })
                }
              >
                <option value="">Seleccioná una categoría</option>

                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label">Badge (opcional)</label>

              <select
                className="field__select"
                value={form.badge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    badge: e.target.value,
                  })
                }
              >
                <option value="">Sin badge</option>

                <option value="popular">Popular</option>

                <option value="nuevo">Nuevo</option>
              </select>
            </div>

            <div className="field">
              <label className="field__label">Imagen</label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;

                  setImageFile(file);

                  if (file) {
                    const url = URL.createObjectURL(file);

                    setPreviewUrl(url);
                  } else {
                    setPreviewUrl(null);
                  }
                }}
                className="file-input"
              />

              {previewUrl && (
                <div className="image-preview">
                  <p className="image-preview__label image-preview__label--accent">
                    Preview — así se va a ver
                  </p>

                  <img
                    src={previewUrl}
                    alt="preview"
                    className="image-preview__image image-preview__image--accent"
                  />
                </div>
              )}

              {form.image_url && !previewUrl && (
                <div className="image-preview">
                  <p className="image-preview__label">Imagen actual</p>

                  <img
                    src={form.image_url}
                    alt="actual"
                    className="image-preview__image"
                  />
                </div>
              )}
            </div>

            <div className="field field--inline">
              <label className="field__label">Disponible</label>

              <label className="toggle">
                <input
                  type="checkbox"
                  className="toggle__input"
                  checked={form.available}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      available: e.target.checked,
                    })
                  }
                />

                <span className="toggle__slider" />
              </label>
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

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Eliminar producto</h2>

            <div className="modal__media-row">
              {confirmDelete.image_url && (
                <img
                  src={confirmDelete.image_url}
                  alt={confirmDelete.name}
                  className="modal__image"
                />
              )}

              <p className="modal__text">
                ¿Eliminás{" "}
                <strong className="text-primary">{confirmDelete.name}</strong>
                ? Esta acción no se puede deshacer y también eliminará la imagen
                del producto.
              </p>
            </div>

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
