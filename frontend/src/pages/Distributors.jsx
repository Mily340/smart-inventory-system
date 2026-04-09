import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Distributors() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const fetchDistributors = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await client.get("/distributors");
      setItems(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load distributors";
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
    fetchDistributors();
  }, []);

  const createDistributor = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/distributors", { name, email, phone, address });
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      fetchDistributors();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create distributor");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Distributors</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">Create Distributor</h6>

            <form onSubmit={createDistributor} className="row g-2">
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Address (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="col-md-2">
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
                  <th>Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td>{d.code || "-"}</td>
                    <td>{d.name}</td>
                    <td>{d.email}</td>
                    <td>{d.phone || "-"}</td>
                    <td>{d.address || "-"}</td>
                  </tr>
                ))}

                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No distributors found
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