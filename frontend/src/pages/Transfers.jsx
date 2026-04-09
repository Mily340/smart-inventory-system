import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Transfers() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getBranchLabel = (id) => {
    const b = branches.find((x) => x.id === id);
    if (!b) return "-";
    return `${b.code ? b.code + " - " : ""}${b.name}`;
  };

  // (Keeping this in case you use it later, but not required)
  const getProductLabel = (id) => {
    const p = products.find((x) => x.id === id);
    if (!p) return "-";
    return `${p.code ? p.code + " - " : ""}${p.name}`;
  };

  const fetchAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [bRes, pRes, tRes] = await Promise.all([
        client.get("/branches"),
        client.get("/products"),
        client.get("/transfers"),
      ]);

      const b = bRes.data?.data || [];
      const p = pRes.data?.data || [];
      const t = tRes.data?.data || [];

      setBranches(b);
      setProducts(p);
      setTransfers(t);

      if (!fromBranchId && b.length > 0) setFromBranchId(b[0].id);
      if (!toBranchId && b.length > 1) setToBranchId(b[1].id);
      if (!productId && p.length > 0) setProductId(p[0].id);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load transfers";
      setError(msg);
      if (msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTransfer = async (e) => {
    e.preventDefault();
    setError("");

    if (fromBranchId === toBranchId) {
      setError("From and To branch cannot be the same");
      return;
    }

    try {
      await client.post("/transfers", {
        fromBranchId,
        toBranchId,
        items: [{ productId, quantity: Number(quantity) }],
      });
      setQuantity("");
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create transfer");
    }
  };

  const action = async (id, type) => {
    setError("");
    try {
      await client.patch(`/transfers/${id}/${type}`);
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed");
    }
  };

  const renderActions = (t) => {
    if (t.status === "PENDING") {
      return (
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => action(t.id, "approve")}
          >
            Approve
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => action(t.id, "reject")}
          >
            Reject
          </button>
        </div>
      );
    }

    if (t.status === "APPROVED") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => action(t.id, "dispatch")}
        >
          Dispatch
        </button>
      );
    }

    if (t.status === "DISPATCHED") {
      return (
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => action(t.id, "receive")}
        >
          Receive
        </button>
      );
    }

    return <span className="text-muted">—</span>;
  };

  return (
    <>
      <NavBar />
      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Transfers</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title mb-2">Create Transfer (1 item)</h6>

            <div className="small text-muted mb-3">
              <strong>Request From:</strong> {getBranchLabel(fromBranchId)}{" "}
              <strong className="mx-2">→</strong>
              <strong>Request To:</strong> {getBranchLabel(toBranchId)}
            </div>

            <form onSubmit={createTransfer} className="row g-2">
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={fromBranchId}
                  onChange={(e) => setFromBranchId(e.target.value)}
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `${b.code} - ` : ""}
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={toBranchId}
                  onChange={(e) => setToBranchId(e.target.value)}
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `${b.code} - ` : ""}
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} - ` : ""}
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-1">
                <input
                  className="form-control"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-primary w-100">Create</button>
              </div>

            </form>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Request From</th>
                  <th>Request To</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td style={{ maxWidth: 160 }} className="text-truncate">
                      {t.id}
                    </td>
                    <td>
                      {t.fromBranch?.code} {t.fromBranch?.name}
                    </td>
                    <td>
                      {t.toBranch?.code} {t.toBranch?.name}
                    </td>
                    <td>{t.status}</td>
                    <td>
                      {t.items?.map((it) => (
                        <div key={it.id}>
                          {it.product?.code} {it.product?.name} x {it.quantity}
                        </div>
                      ))}
                    </td>
                    <td>{renderActions(t)}</td>
                  </tr>
                ))}

                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No transfers found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}