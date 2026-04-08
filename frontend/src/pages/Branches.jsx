import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Branches() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const fetchBranches = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await client.get("/branches");
      setBranches(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branches";
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
    fetchBranches();
  }, []);

  const createBranch = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await client.post("/branches", {
        name,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create branch");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Branches</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">Create Branch</h6>

            <form onSubmit={createBranch} className="row g-2">
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
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
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
                  <th>Address</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.code || "-"}</td>
                    <td>{b.name}</td>
                    <td>{b.address}</td>
                    <td>{b.latitude}</td>
                    <td>{b.longitude}</td>
                  </tr>
                ))}

                {branches.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No branches found
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