import { useEffect, useState } from 'react'; import { resource } from '../services/resourceService'; import client from '../services/api'; import Modal from '../components/Modal'; import StatusBadge from '../components/StatusBadge';
export default function AssignmentsPage() {
  const api = resource('/assignments');
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const refreshDropdowns = () => {
    Promise.all([
      resource('/vehicles').list({ limit: 100, status: 'AVAILABLE' }),
      resource('/drivers').list({ limit: 100, status: 'AVAILABLE' })
    ]).then(([v, d]) => {
      setVehicles(v.data || []);
      setDrivers(d.data || []);
    }).catch(() => {});
  };
  const load = () => {
    api.list({ limit: 50 }).then((r) => setItems(r.data || [])).catch((e) => setError(e.message));
    refreshDropdowns();
  };
  useEffect(() => { load(); }, []);
  const unassign = async (id) => {
    try {
      await client.patch(`/assignments/${id}/unassign`);
      load();
    } catch (e) {
      setError(e.message || 'Failed to unassign');
    }
  };
  return <div className="content-page"><div className="page-heading"><div><p className="eyebrow">FLEET CONTROL</p><h2>Vehicle assignments</h2><p className="muted">Pair an available vehicle with an available driver.</p></div><button className="primary" onClick={() => setShow(true)}>+ New assignment</button></div>{error && <p className="form-error">{error}</p>}<section className="table-panel"><div className="table-wrap"><table><thead><tr><th>Vehicle</th><th>Driver</th><th>Branch</th><th>Assigned</th><th>Status</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td>{item.vehicle?.registrationNumber || '—'}</td><td>{item.driver?.user?.name || item.driver?.licenseNumber || '—'}</td><td>{item.branch?.name || '—'}</td><td>{item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : '—'}</td><td><StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /></td><td className="actions">{item.isActive && <button className="danger-text" onClick={() => unassign(item._id)}>Unassign</button>}</td></tr>)}</tbody></table></div></section>{show && <Modal title="New vehicle assignment" onClose={() => setShow(false)}><form className="record-form" onSubmit={async (e) => { e.preventDefault(); try { const data = Object.fromEntries(new FormData(e.currentTarget)); await api.create(data); setShow(false); load(); } catch (err) { setError(err.message); } }}><label>Vehicle<select required name="vehicle"><option value="">Select vehicle…</option>{vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} · {v.make} {v.model}</option>)}</select></label><label>Driver<select required name="driver"><option value="">Select driver…</option>{drivers.map((d) => <option key={d._id} value={d._id}>{d.user?.name || 'Driver'} · {d.licenseNumber}</option>)}</select></label><div className="form-actions"><button type="button" className="secondary" onClick={() => setShow(false)}>Cancel</button><button className="primary">Assign vehicle</button></div></form></Modal>}</div>;
}
