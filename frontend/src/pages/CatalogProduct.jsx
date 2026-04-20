import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";

export default function CatalogProduct() {
  const { id } = useParams();

  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        const res = await client.get(`/public/products/${id}`);
        setP(res.data?.data || null);
      } catch (e) {
        setError(e?.response?.data?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="container" style={{ marginTop: 28, maxWidth: 850 }}>
      {/* Public Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link to="/catalog" className="text-decoration-none">
          <div style={{ fontWeight: 800, color: "#7600bc", fontSize: 22 }}>
            SMART INVENTORY
          </div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            Public Product Details
          </div>
        </Link>

        <div className="d-flex gap-2">
          <Link to="/catalog" className="btn btn-outline-secondary btn-sm">
            Back
          </Link>
          <Link to="/login" className="btn btn-outline-secondary btn-sm">
            Staff Login
          </Link>
        </div>
      </div>

      {loading ? <div>Loading...</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {!loading && p ? (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <span className="badge bg-light text-dark">{p.category?.name || "Uncategorized"}</span>
              <span className="text-muted">{p.code || "-"}</span>
            </div>

            <h4 className="mt-3">{p.name}</h4>
            <div className="text-muted">SKU: {p.sku}</div>

            <hr />

            <div className="row g-2">
              <div className="col-md-6">
                <div className="fw-semibold">Price</div>
                <div>৳{p.price}</div>
              </div>

              <div className="col-md-6">
                <div className="fw-semibold">Unit</div>
                <div>{p.unit}</div>
              </div>
            </div>

            <hr />

            <div className="fw-semibold mb-1">Description</div>
            <div className="text-muted">{p.description || "No description available."}</div>

            <hr />

            <div className="small text-muted">
              For orders/contact: Please login as staff or contact the nearest branch.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}