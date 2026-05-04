// dispatcher-app/src/MASFreightSite.jsx
// Full API-wired MAS Freight Dispatcher + Marketing Website
import { useState, useEffect, useCallback } from "react";
import { Auth, Loads, Trucks, Applications, Stats, Notifications } from "./api";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const statusColor = { active:"#000", on_trip:"#2d6a4f", inactive:"#aaa", pending_review:"#e67e22", suspended:"#c0392b" };
const statusLabel = { active:"Active", on_trip:"On Trip", inactive:"Inactive", pending_review:"Pending Review", suspended:"Suspended" };
const docLabels = {
  truck_front:"Truck (Front)", truck_back:"Truck (Back)",
  trailer_front:"Trailer (Front)", trailer_back:"Trailer (Back)",
  driver_license_front:"License (Front)", driver_license_back:"License (Back)",
  national_id_front:"National ID (Front)", national_id_back:"National ID (Back)",
  dj_permit_front:"DJ Permit (Front)", dj_permit_back:"DJ Permit (Back)",
};
const calcNet = (t, c) => Math.round(t * (1 - c / 100));
const BAR_DATA = [{l:"Jan",v:42},{l:"Feb",v:58},{l:"Mar",v:51},{l:"Apr",v:88},{l:"May",v:73},{l:"Jun",v:66},{l:"Jul",v:79}];

// ─────────────────────────────────────────────────────────────────────────────
// DOC VIEWER
// ─────────────────────────────────────────────────────────────────────────────
function DocViewer({ truck, onClose }) {
  const [active, setActive] = useState(0);
  const docs = truck.documents || [];
  const doc = docs[active];
  const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

  const getUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)" }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:700,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.3)" }}>
        {/* Header */}
        <div style={{ padding:"18px 24px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:12,flexShrink:0 }}>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:"50%",border:"1px solid #e8e8e8",background:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900 }}>{truck.driver_name} — Documents</div>
            <div style={{ fontSize:12,color:"#bbb" }}>{truck.truck_id || "Pending"} · {truck.plate_number}{truck.trailer_plate ? ` | ${truck.trailer_plate}` : ""}</div>
          </div>
          {doc && getUrl(doc.url) && (
            <a href={getUrl(doc.url)} download target="_blank" rel="noreferrer"
              style={{ marginLeft:"auto",background:"#000",color:"#fff",border:"none",borderRadius:9,padding:"8px 16px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:800,cursor:"pointer",textDecoration:"none" }}>
              ⬇ Download
            </a>
          )}
        </div>

        <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
          {/* Doc list sidebar */}
          <div style={{ width:180,borderRight:"1px solid #f0f0f0",padding:"10px 8px",overflowY:"auto",flexShrink:0 }}>
            {docs.length === 0 && <div style={{ color:"#bbb",fontSize:12,padding:"8px 4px" }}>No documents</div>}
            {docs.map((d, i) => (
              <div key={i} onClick={() => setActive(i)}
                style={{ padding:"9px 11px",borderRadius:9,cursor:"pointer",marginBottom:3,background:active===i?"#000":"transparent",color:active===i?"#fff":"#555",display:"flex",alignItems:"center",gap:7 }}>
                <span style={{ fontSize:14 }}>📄</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:500 }}>{docLabels[d.type] || d.type}</span>
              </div>
            ))}
          </div>

          {/* Doc preview */}
          <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"#f7f7f7",padding:20 }}>
            {doc && getUrl(doc.url) ? (
              <img src={getUrl(doc.url)} alt={doc.type}
                style={{ maxWidth:"100%",maxHeight:"60vh",borderRadius:12,boxShadow:"0 4px 24px rgba(0,0,0,.1)",objectFit:"contain" }}/>
            ) : (
              <div style={{ color:"#bbb",fontSize:13,letterSpacing:2 }}>
                {docs.length === 0 ? "NO DOCUMENTS" : "SELECT A DOCUMENT"}
              </div>
            )}
          </div>
        </div>

        {/* Info grid */}
        {truck && (
          <div style={{ padding:"14px 24px",borderTop:"1px solid #f0f0f0",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,flexShrink:0 }}>
            {[
              ["Truck Plate", truck.plate_number],
              ["Trailer Plate", truck.trailer_plate || "—"],
              ["Truck Type", truck.truck_type],
              ["MAS ID", truck.truck_id || "Pending"],
              ["License No", truck.license_number || "—"],
              ["DJ Permit", truck.dj_permit_number || "—"],
              ["Phone ET", truck.driver_phone_et || "—"],
              ["Phone DJ", truck.driver_phone_dj || "—"],
            ].map(([k,v]) => (
              <div key={k} style={{ background:"#f7f7f7",borderRadius:8,padding:"8px 10px" }}>
                <div style={{ fontSize:9,color:"#bbb",fontWeight:600,marginBottom:2 }}>{k}</div>
                <div style={{ fontSize:12,fontWeight:500 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLEET SEARCH MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FleetSearch({ fleet, onClose, onViewDocs }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const results = fleet.filter(t =>
    [t.plate_number, t.trailer_plate, t.driver_name, t.truck_id, t.owner_name]
      .some(f => f?.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:640,maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,.2)" }}>
        <div style={{ padding:"18px 24px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:12,flexShrink:0 }}>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:"50%",border:"1px solid #e8e8e8",background:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900 }}>Fleet Registry — {fleet.length} Trucks</div>
        </div>
        <div style={{ padding:"12px 20px",borderBottom:"1px solid #f5f5f5",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",background:"#f5f5f5",border:"1px solid #e8e8e8",borderRadius:12,padding:"0 14px",height:42 }}>
            <span style={{ color:"#bbb",fontSize:16,marginRight:9 }}>🔍</span>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search plate, trailer, name, or MAS ID..."
              style={{ flex:1,background:"none",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#000" }}/>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {sel ? (
            <div style={{ padding:24 }}>
              <button onClick={() => setSel(null)} style={{ background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:13,marginBottom:16 }}>← Back to list</button>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:18 }}>
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900 }}>{sel.plate_number}</div>
                    <div style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,background:statusColor[sel.status]||"#aaa",color:"#fff" }}>{statusLabel[sel.status]||sel.status}</div>
                  </div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,color:"#888",fontWeight:700,letterSpacing:.5 }}>TRAILER: {sel.trailer_plate||"—"}</div>
                  <div style={{ fontSize:15,fontWeight:500,marginTop:2 }}>{sel.driver_name}</div>
                  <div style={{ fontSize:12,color:"#aaa" }}>{sel.truck_id || "Pending MAS ID"}</div>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
                {[["Truck ID",sel.truck_id||"Pending"],["Truck Plate",sel.plate_number],["Trailer Plate",sel.trailer_plate||"—"],["Truck Type",sel.truck_type],["Owner",sel.owner_name],["Owner Phone",sel.owner_phone_et||"—"],["Driver Phone ET",sel.driver_phone_et||"—"],["Driver Phone DJ",sel.driver_phone_dj||"—"],["National ID",sel.driver_id_number||"—"],["License",sel.license_number||"—"],["DJ Permit",sel.dj_permit_number||"—"],["Status",statusLabel[sel.status]||sel.status]].map(([k,v]) => (
                  <div key={k} style={{ background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:9,padding:"9px 12px" }}>
                    <div style={{ fontSize:10,color:"#bbb",fontWeight:600,marginBottom:2 }}>{k}</div>
                    <div style={{ fontSize:13,fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => onViewDocs(sel)}
                style={{ width:"100%",background:"#000",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:800,cursor:"pointer" }}>
                📄 View Documents ({(sel.documents||[]).length})
              </button>
            </div>
          ) : results.map(t => (
            <div key={t.id} onClick={() => setSel(t)}
              style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:"1px solid #fafafa",cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:900 }}>{t.plate_number}</div>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,color:"#bbb" }}>| {t.trailer_plate||"—"}</span>
                  <div style={{ fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:4,background:statusColor[t.status]||"#aaa",color:"#fff" }}>{statusLabel[t.status]||t.status}</div>
                </div>
                <div style={{ fontSize:12,color:"#888" }}>{t.driver_name} · {t.truck_type} · {t.truck_id||"Pending"}</div>
              </div>
              <div style={{ color:"#ccc",fontSize:18 }}>›</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATIONS TAB — approve / reject pending trucks
// ─────────────────────────────────────────────────────────────────────────────
function RegistrationsTab({ onViewDocs, onDataChange }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPending(await Trucks.pendingReview()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setActing(id + "_approve");
    try {
      await Trucks.approve(id);
      await load();
      onDataChange?.();
    } catch (e) { alert(e.message); }
    finally { setActing(null); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { alert("Rejection reason required"); return; }
    setActing(rejectId + "_reject");
    try {
      await Trucks.reject(rejectId, rejectReason);
      setRejectId(null); setRejectReason("");
      await load();
      onDataChange?.();
    } catch (e) { alert(e.message); }
    finally { setActing(null); }
  };

  if (loading) return <div style={{ padding:40,textAlign:"center",color:"#bbb" }}>Loading registrations...</div>;

  return (
    <div>
      {/* Reject reason modal */}
      {rejectId && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:420 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,marginBottom:8 }}>Reject Registration</div>
            <div style={{ fontSize:13,color:"#888",marginBottom:16 }}>Provide a reason. The driver will be notified.</div>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Documents unclear, please resubmit with sharper photos."
              style={{ width:"100%",background:"#f7f7f7",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",resize:"none",minHeight:80,marginBottom:16 }}/>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={() => { setRejectId(null); setRejectReason(""); }}
                style={{ flex:1,background:"none",border:"1px solid #e8e8e8",borderRadius:9,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",color:"#888" }}>Cancel</button>
              <button onClick={reject} disabled={!!acting}
                style={{ flex:2,background:"#c0392b",color:"#fff",border:"none",borderRadius:9,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:900,cursor:"pointer",opacity:acting?.7:1 }}>
                {acting ? "Rejecting..." : "CONFIRM REJECT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pending.length === 0 ? (
        <div style={{ textAlign:"center",padding:60,color:"#bbb" }}>
          <div style={{ fontSize:40,marginBottom:12 }}>✅</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:22 }}>No pending registrations</div>
        </div>
      ) : pending.map(truck => (
        <div key={truck.id} style={{ border:"1.5px solid #ebebeb",borderRadius:14,marginBottom:10,overflow:"hidden" }}>
          {/* Row header */}
          <div onClick={() => setExpanded(expanded===truck.id ? null : truck.id)}
            style={{ padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12 }}
            onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900 }}>{truck.plate_number}</div>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,color:"#bbb" }}>| {truck.trailer_plate||"—"}</span>
                <div style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,background:"#e67e22",color:"#fff" }}>PENDING REVIEW</div>
              </div>
              <div style={{ fontSize:13,color:"#555" }}>{truck.driver_name} · {truck.truck_type}</div>
              <div style={{ fontSize:11,color:"#bbb",marginTop:2 }}>Submitted: {new Date(truck.submitted_at).toLocaleDateString()}</div>
            </div>
            <div style={{ color:"#ccc",fontSize:14 }}>{expanded===truck.id?"▲":"▼"}</div>
          </div>

          {/* Expanded detail */}
          {expanded===truck.id && (
            <div style={{ borderTop:"1px solid #f0f0f0",padding:"16px 18px",background:"#fafafa" }}>
              {/* Info grid */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14 }}>
                {[
                  ["TRUCK PLATE", truck.plate_number],
                  ["TRAILER PLATE", truck.trailer_plate||"—"],
                  ["TRUCK TYPE", truck.truck_type],
                  ["TRAILER TYPE", truck.trailer_type||"—"],
                  ["OWNER", truck.owner_name],
                  ["OWNER PHONE", truck.owner_phone_et||"—"],
                  ["DRIVER NAME", truck.driver_name],
                  ["DRIVER PHONE ET", truck.driver_phone_et||"—"],
                  ["DRIVER PHONE DJ", truck.driver_phone_dj||"—"],
                  ["NATIONAL ID", truck.driver_id_number||"—"],
                  ["LICENSE NO", truck.license_number||"—"],
                  ["DJ PERMIT NO", truck.dj_permit_number||"—"],
                ].map(([k,v]) => (
                  <div key={k} style={{ background:"#fff",border:"1px solid #ebebeb",borderRadius:8,padding:"8px 11px" }}>
                    <div style={{ fontSize:9,color:"#bbb",fontWeight:600,letterSpacing:.5,marginBottom:2 }}>{k}</div>
                    <div style={{ fontSize:12,fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11,color:"#bbb",fontWeight:700,letterSpacing:1,marginBottom:8 }}>SUBMITTED DOCUMENTS ({(truck.documents||[]).length})</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                  {(truck.documents||[]).map((d,i) => (
                    <div key={i} style={{ background:"#fff",border:"1px solid #ebebeb",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#555",display:"flex",alignItems:"center",gap:5 }}>
                      <span>📄</span>{docLabels[d.type]||d.type}
                    </div>
                  ))}
                  {(truck.documents||[]).length === 0 && <div style={{ fontSize:12,color:"#c0392b" }}>No documents uploaded</div>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={() => approve(truck.id)} disabled={!!acting}
                  style={{ flex:2,background:"#000",color:"#fff",border:"none",borderRadius:9,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:900,cursor:"pointer",opacity:acting===truck.id+"_approve"?.7:1 }}>
                  {acting===truck.id+"_approve" ? "Approving..." : "✓ APPROVE — ASSIGN MF ID"}
                </button>
                <button onClick={() => onViewDocs(truck)} style={{ background:"none",border:"1px solid #e8e8e8",borderRadius:9,padding:"11px 14px",cursor:"pointer",fontSize:14 }}>📄 Docs</button>
                <button onClick={() => setRejectId(truck.id)}
                  style={{ flex:1,background:"none",border:"1px solid #fecaca",borderRadius:9,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",color:"#c0392b" }}>
                  ✕ Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCHER PORTAL
// ─────────────────────────────────────────────────────────────────────────────
function DispatcherPortal({ onLogout }) {
  const [nav, setNav] = useState("dashboard");
  const [loads, setLoads] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selLoad, setSelLoad] = useState(null);
  const [loadApps, setLoadApps] = useState([]);
  const [expandedApp, setExpandedApp] = useState(null);
  const [showPost, setShowPost] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsCurPw, setSettingsCurPw] = useState("");
  const [settingsNewPw, setSettingsNewPw] = useState("");
  const [settingsConfPw, setSettingsConfPw] = useState("");
  const [settingsNewEmail, setSettingsNewEmail] = useState("");
  const [settingsEmailPw, setSettingsEmailPw] = useState("");
  const [settingsPwLoading, setSettingsPwLoading] = useState(false);
  const [settingsPwMsg, setSettingsPwMsg] = useState({type:"",text:""});
  const [settingsEmailLoading, setSettingsEmailLoading] = useState(false);
  const [settingsEmailMsg, setSettingsEmailMsg] = useState({type:"",text:""});
  const [showFleet, setShowFleet] = useState(false);
  const [viewDocs, setViewDocs] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [actingApp, setActingApp] = useState(null);
  const [loadingApps, setLoadingApps] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type:'close'|'delete', loadId }

  const [newLoad, setNewLoad] = useState({
    cargo:"", pickup_city:"", dropoff_city:"", distance_km:"",
    weight_quintal:"", price_per_quintal:"", slots:"", commission_pct:"", description:"", is_urgent:false, broker_name:"", loading_start:""
  });
  const [posting, setPosting] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [l, fl, st, n] = await Promise.all([
        Loads.all(),
        Trucks.all(),
        Stats.dispatcher(),
        Notifications.list(),
      ]);
      setLoads(l);
      setFleet(fl);
      setStats(st);
      setNotifs(n.notifications || []);
      setUnread(n.unread || 0);
      setPendingCount(st.pendingRegistrations || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Poll every 30s for new notifications/registrations
  useEffect(() => {
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const openLoad = async (load) => {
    setSelLoad(load);
    setLoadingApps(true);
    try {
      const apps = await Applications.forLoad(load.id);
      setLoadApps(apps);
    } catch (e) { setLoadApps([]); }
    finally { setLoadingApps(false); }
  };

  const acceptApp = async (appId) => {
    setActingApp(appId + "_accept");
    try {
      await Applications.accept(appId);
      const apps = await Applications.forLoad(selLoad.id);
      setLoadApps(apps);
      await loadAll();
    } catch (e) { alert(e.message); }
    finally { setActingApp(null); }
  };

  const rejectApp = async (appId) => {
    setActingApp(appId + "_reject");
    try {
      await Applications.reject(appId);
      const apps = await Applications.forLoad(selLoad.id);
      setLoadApps(apps);
    } catch (e) { alert(e.message); }
    finally { setActingApp(null); }
  };

  const postLoad = async () => {
    if (!newLoad.cargo || !newLoad.pickup_city || !newLoad.dropoff_city) {
      alert("Cargo, pickup city, and dropoff city are required."); return;
    }
    setPosting(true);
    try {
      await Loads.post({ ...newLoad, distance_km: parseInt(newLoad.distance_km)||0, weight_quintal: parseFloat(newLoad.weight_quintal)||0, price_per_quintal: parseFloat(newLoad.price_per_quintal)||0, commission_pct: parseFloat(newLoad.commission_pct)||5, slots: parseInt(newLoad.slots)||5, broker_name: newLoad.broker_name||null, loading_start: newLoad.loading_start||null });
      setNewLoad({ cargo:"",pickup_city:"",dropoff_city:"",distance_km:"",weight_quintal:"",price_per_quintal:"",slots:"",commission_pct:"",description:"",is_urgent:false,broker_name:"",loading_start:"" });
      setShowPost(false);
      await loadAll();
    } catch (e) { alert(e.message); }
    finally { setPosting(false); }
  };

  const closeLoad = async (id) => {
    try { await Loads.close(id); await loadAll(); setConfirmAction(null); }
    catch (e) { alert(e.message); }
  };

  const deleteLoad = async (id) => {
    try { await Loads.delete(id); setSelLoad(null); await loadAll(); setConfirmAction(null); }
    catch (e) { alert(e.message); }
  };

  const markAllRead = async () => {
    await Notifications.markAllRead();
    setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, read:true })));
  };

  const maxBar = Math.max(...BAR_DATA.map(b => b.v));

  const S = {
    wrap: { display:"flex",minHeight:"100vh",background:"#f5f5f5",fontFamily:"'DM Sans',sans-serif" },
    sb: { width:240,background:"#fff",borderRight:"1px solid #ebebeb",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0,boxShadow:"2px 0 12px rgba(0,0,0,.04)" },
    main: { flex:1,padding:"30px 30px 60px",overflowY:"auto",minWidth:0 },
    ptitle: { fontFamily:"'Barlow Condensed',sans-serif",fontSize:40,fontWeight:900,lineHeight:1,color:"#000" },
    psub: { color:"#bbb",fontSize:13,marginTop:3 },
    statsRow: { display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20 },
    stbox: { background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:"18px",boxShadow:"0 1px 4px rgba(0,0,0,.03)" },
    stlbl: { fontSize:11,color:"#bbb",letterSpacing:.5,marginBottom:5,fontWeight:600 },
    stval: { fontFamily:"'Barlow Condensed',sans-serif",fontSize:40,fontWeight:900,lineHeight:1 },
    tbox: { background:"#fff",border:"1px solid #ebebeb",borderRadius:14,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,.03)" },
    tboxHdr: { display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",borderBottom:"1px solid #f5f5f5" },
    tboxT: { fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800 },
    tr: { display:"flex",alignItems:"center",gap:10,padding:"12px 18px",borderBottom:"1px solid #fafafa",cursor:"pointer",transition:"background .15s" },
  };

  const NavBtn = ({ id, ico, lbl, badge }) => (
    <button onClick={() => setNav(id)}
      style={{ display:"flex",alignItems:"center",gap:9,padding:"10px 11px",borderRadius:10,cursor:"pointer",color:nav===id?"#fff":"#bbb",background:nav===id?"#000":"none",border:"none",width:"100%",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,marginBottom:2,position:"relative" }}>
      <span style={{ fontSize:16,width:20,textAlign:"center" }}>{ico}</span>
      {lbl}
      {badge > 0 && (
        <span style={{ marginLeft:"auto",background:nav===id?"#fff":"#c0392b",color:nav===id?"#000":"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"2px 7px",minWidth:18,textAlign:"center" }}>{badge}</span>
      )}
    </button>
  );

  return (
    <div style={S.wrap}>
      {viewDocs && <DocViewer truck={viewDocs} onClose={() => setViewDocs(null)}/>}
      {showFleet && <FleetSearch fleet={fleet} onClose={() => setShowFleet(false)} onViewDocs={t => { setViewDocs(t); setShowFleet(false); }}/>}

      {/* Confirm close/delete modal */}
      {confirmAction && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:400 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,marginBottom:8 }}>
              {confirmAction.type==="close" ? "Close Load?" : "Delete Load?"}
            </div>
            <div style={{ fontSize:13,color:"#888",marginBottom:20,lineHeight:1.6 }}>
              {confirmAction.type==="close"
                ? "Closing this load will stop new applications. Accepted drivers will keep their trips in their Finance tab."
                : "Deleting this load removes it from the board. Pending applications are cancelled. Accepted driver trips are preserved."}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={() => setConfirmAction(null)}
                style={{ flex:1,background:"none",border:"1px solid #e8e8e8",borderRadius:9,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",color:"#888" }}>Cancel</button>
              <button onClick={() => confirmAction.type==="close" ? closeLoad(confirmAction.loadId) : deleteLoad(confirmAction.loadId)}
                style={{ flex:2,background:confirmAction.type==="close"?"#555":"#c0392b",color:"#fff",border:"none",borderRadius:9,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:900,cursor:"pointer" }}>
                {confirmAction.type==="close" ? "CLOSE LOAD" : "DELETE LOAD"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications panel */}
      {showNotifs && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:500,display:"flex",justifyContent:"flex-end" }} onClick={() => setShowNotifs(false)}>
          <div style={{ width:380,background:"#fff",height:"100vh",overflowY:"auto",padding:24,boxShadow:"-8px 0 32px rgba(0,0,0,.1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900 }}>Notifications</div>
              {unread > 0 && <button onClick={markAllRead} style={{ background:"none",border:"1px solid #e8e8e8",borderRadius:8,fontSize:12,padding:"5px 12px",cursor:"pointer",color:"#888" }}>Mark all read</button>}
            </div>
            {notifs.length === 0 && <div style={{ color:"#bbb",fontSize:14,textAlign:"center",paddingTop:40 }}>No notifications</div>}
            {notifs.map(n => (
              <div key={n.id} style={{ padding:"12px 14px",borderRadius:10,marginBottom:6,background:n.read?"transparent":"#f8f8f8",border:"1px solid",borderColor:n.read?"#f5f5f5":"#ebebeb" }}>
                <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{n.title}</div>
                <div style={{ fontSize:12,color:"#888",lineHeight:1.5 }}>{n.body}</div>
                <div style={{ fontSize:11,color:"#bbb",marginTop:4 }}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POST LOAD MODAL */}
      {showPost && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}>
          <div style={{ background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:560,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,.15)" }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:20 }}>Post New Load</div>
            {[
              ["CARGO TYPE","cargo","Sugar, Cement...","text"],
              ["PICKUP CITY","pickup_city","Addis Ababa","text"],
              ["DROPOFF CITY","dropoff_city","Djibouti","text"],
              ["DISTANCE (KM)","distance_km","780","number"],
              ["WEIGHT (QUINTAL)","weight_quintal","20","number"],
              ["PRICE / QUINTAL (ETB)","price_per_quintal","1200","number"],
              ["TRUCK SLOTS","slots","5","number"],
              ["COMMISSION %","commission_pct","5","number"],
            ].map(([lbl,key,ph,type]) => (
              <div key={key} style={{ marginBottom:13 }}>
                <div style={{ fontSize:11,color:"#bbb",letterSpacing:.5,fontWeight:600,marginBottom:5 }}>{lbl}</div>
                <input value={newLoad[key]} onChange={e => setNewLoad(p=>({...p,[key]:e.target.value}))} placeholder={ph} type={type}
                  style={{ width:"100%",background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,color:"#000",padding:"12px 15px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none" }}/>
              </div>
            ))}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:13 }}>
              <div>
                <div style={{ fontSize:11,color:"#bbb",letterSpacing:.5,fontWeight:600,marginBottom:5 }}>BROKER NAME</div>
                <input value={newLoad.broker_name||""} onChange={e => setNewLoad(p=>({...p,broker_name:e.target.value}))} placeholder="e.g. Ethio Logistics"
                  style={{ width:"100%",background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,color:"#000",padding:"12px 15px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none" }}/>
              </div>
              <div>
                <div style={{ fontSize:11,color:"#bbb",letterSpacing:.5,fontWeight:600,marginBottom:5 }}>LOADING START</div>
                <input value={newLoad.loading_start||""} onChange={e => setNewLoad(p=>({...p,loading_start:e.target.value}))} type="datetime-local"
                  style={{ width:"100%",background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,color:"#000",padding:"12px 15px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none" }}/>
              </div>
            </div>
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:11,color:"#bbb",letterSpacing:.5,fontWeight:600,marginBottom:5 }}>LOAD DESCRIPTION</div>
              <textarea value={newLoad.description} onChange={e => setNewLoad(p=>({...p,description:e.target.value}))} placeholder="Cargo details, handling requirements..."
                style={{ width:"100%",background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,color:"#000",padding:"12px 15px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",resize:"none",minHeight:75 }}/>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
              <input type="checkbox" id="urgent_chk" checked={newLoad.is_urgent} onChange={e => setNewLoad(p=>({...p,is_urgent:e.target.checked}))} style={{ width:16,height:16,cursor:"pointer" }}/>
              <label htmlFor="urgent_chk" style={{ fontSize:13,fontWeight:600,cursor:"pointer" }}>Mark as URGENT</label>
            </div>
            {newLoad.price_per_quintal && newLoad.weight_quintal && (
              <div style={{ background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,padding:"12px 15px",display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                <span style={{ fontSize:13,color:"#888" }}>Driver nets ({100 - parseFloat(newLoad.commission_pct||0)}%)</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900 }}>
                  {calcNet(parseFloat(newLoad.price_per_quintal||0)*parseFloat(newLoad.weight_quintal||0), parseFloat(newLoad.commission_pct||0)).toLocaleString()} ETB
                </span>
              </div>
            )}
            <div style={{ display:"flex",gap:10,marginTop:18 }}>
              <button onClick={() => setShowPost(false)}
                style={{ flex:1,background:"none",border:"1px solid #e8e8e8",borderRadius:10,color:"#888",padding:13,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,cursor:"pointer" }}>CANCEL</button>
              <button onClick={postLoad} disabled={posting}
                style={{ flex:2,background:"#000",color:"#fff",border:"none",borderRadius:10,padding:13,fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:900,cursor:"pointer",opacity:posting?.7:1 }}>
                {posting ? "POSTING..." : "POST LOAD"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLICANT PANEL */}
      {selLoad && (
        <>
          <div onClick={() => setSelLoad(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.2)",zIndex:200,backdropFilter:"blur(2px)" }}/>
          <div style={{ position:"fixed",right:0,top:0,bottom:0,width:480,background:"#fff",borderLeft:"1px solid #ebebeb",zIndex:210,display:"flex",flexDirection:"column",boxShadow:"-8px 0 32px rgba(0,0,0,.08)",animation:"pIn .25s ease" }}>
            <style>{`@keyframes pIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            {/* Panel header */}
            <div style={{ padding:"18px 22px 14px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"flex-start",gap:10,flexShrink:0 }}>
              <button onClick={() => setSelLoad(null)}
                style={{ width:32,height:32,borderRadius:"50%",border:"1px solid #e8e8e8",background:"none",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2 }}>←</button>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,lineHeight:1 }}>{selLoad.cargo}</div>
                <div style={{ fontSize:12,color:"#bbb",marginTop:2 }}>{selLoad.pickup_city} → {selLoad.dropoff_city} · {selLoad.commission_pct}% comm{selLoad.broker_name ? ` · ${selLoad.broker_name}` : ""}</div>
                {selLoad.loading_start && <div style={{ fontSize:11,color:"#bbb",marginTop:2 }}>📅 Loading starts: {new Date(selLoad.loading_start).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
              </div>
              {/* Close / Delete actions */}
              <div style={{ display:"flex",gap:6 }}>
                {selLoad.status==="active" && (
                  <button onClick={() => setConfirmAction({ type:"close", loadId:selLoad.id })}
                    style={{ background:"none",border:"1px solid #e8e8e8",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",color:"#888",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700 }}>
                    ⏸ CLOSE
                  </button>
                )}
                <button onClick={() => setConfirmAction({ type:"delete", loadId:selLoad.id })}
                  style={{ background:"none",border:"1px solid #fecaca",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",color:"#c0392b",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700 }}>
                  🗑 DELETE
                </button>
              </div>
            </div>

            <div style={{ flex:1,overflowY:"auto",padding:"16px 22px" }}>
              {/* Load summary */}
              <div style={{ background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:12,padding:"13px 15px",marginBottom:13,display:"flex",justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:10,color:"#bbb",fontWeight:600,marginBottom:2 }}>GROSS PAYOUT</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900 }}>
                    {(parseFloat(selLoad.weight_quintal||0) * parseFloat(selLoad.price_per_quintal||0)).toLocaleString()} ETB
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10,color:"#bbb",fontWeight:600,marginBottom:2 }}>FILLED / SLOTS</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900 }}>
                    {loadApps.filter(a => a.status==="accepted").length}/{selLoad.slots}
                  </div>
                </div>
              </div>

              {selLoad.description && (
                <div style={{ background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,padding:"11px 14px",marginBottom:13,fontSize:13,color:"#666",lineHeight:1.6 }}>
                  <div style={{ fontSize:10,color:"#bbb",fontWeight:700,marginBottom:4 }}>DESCRIPTION</div>
                  {selLoad.description}
                </div>
              )}

              <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:800,letterSpacing:2,color:"#bbb",marginBottom:10 }}>
                APPLICANTS ({loadApps.length})
              </div>

              {loadingApps && <div style={{ color:"#bbb",fontSize:13,textAlign:"center",paddingTop:20 }}>Loading applicants...</div>}
              {!loadingApps && loadApps.length===0 && <div style={{ color:"#bbb",fontSize:14,textAlign:"center",paddingTop:30 }}>No applicants yet.</div>}

              {loadApps.map(app => (
                <div key={app.id} style={{ border:`1.5px solid ${app.status==="accepted"?"#000":"#ebebeb"}`,borderRadius:14,marginBottom:10,overflow:"hidden" }}>
                  <div onClick={() => setExpandedApp(expandedApp===app.id?null:app.id)}
                    style={{ padding:"13px 14px",cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,marginBottom:1 }}>{app.plate_number||"—"}</div>
                        <div style={{ fontSize:11,color:"#aaa",marginBottom:2 }}>Trailer: {app.trailer_plate||"—"}</div>
                        <div style={{ fontSize:13,fontWeight:500,color:"#333" }}>{app.driver_name||"—"}</div>
                        <div style={{ fontSize:11,color:"#bbb" }}>{app.truck_type||"—"} · {app.mas_id||"No MAS ID"}</div>
                        {app.status==="accepted" && (
                          <div style={{ marginTop:5,display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:800,background:"#000",color:"#fff",padding:"3px 8px",borderRadius:4 }}>✓ ACCEPTED</div>
                        )}
                        {app.status==="rejected" && (
                          <div style={{ marginTop:5,display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:800,background:"#c0392b",color:"#fff",padding:"3px 8px",borderRadius:4 }}>✕ REJECTED</div>
                        )}
                      </div>
                      <div style={{ color:"#ccc",fontSize:14,paddingTop:4 }}>{expandedApp===app.id?"▲":"▼"}</div>
                    </div>
                  </div>

                  {expandedApp===app.id && (
                    <div style={{ borderTop:"1px solid #f0f0f0",padding:"13px 14px",background:"#fafafa" }}>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10 }}>
                        {[["PHONE ET",app.driver_phone_et||"—"],["PHONE DJ",app.driver_phone_dj||"—"],["MAS ID",app.mas_id||"—"],["NATIONAL ID",app.driver_id_number||"—"],["TRUCK PLATE",app.plate_number||"—"],["TRAILER PLATE",app.trailer_plate||"—"],["LICENSE",app.license_number||"—"],["DJ PERMIT",app.dj_permit_number||"—"]].map(([k,v]) => (
                          <div key={k} style={{ background:"#fff",border:"1px solid #ebebeb",borderRadius:8,padding:"8px 11px" }}>
                            <div style={{ fontSize:9,color:"#bbb",fontWeight:600,letterSpacing:.5,marginBottom:2 }}>{k}</div>
                            <div style={{ fontSize:12,fontWeight:500 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {app.status === "pending" && (
                        <div style={{ display:"flex",gap:7,marginBottom:8 }}>
                          <button onClick={() => acceptApp(app.id)} disabled={!!actingApp}
                            style={{ flex:2,background:"#000",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:900,cursor:"pointer",opacity:actingApp===app.id+"_accept"?.6:1 }}>
                            {actingApp===app.id+"_accept" ? "..." : "✓ ACCEPT DRIVER"}
                          </button>
                          <button onClick={() => rejectApp(app.id)} disabled={!!actingApp}
                            style={{ flex:1,background:"none",border:"1px solid #fecaca",borderRadius:8,padding:"9px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",color:"#c0392b",opacity:actingApp===app.id+"_reject"?.6:1 }}>
                            {actingApp===app.id+"_reject" ? "..." : "✕ Reject"}
                          </button>
                        </div>
                      )}
                      <button onClick={() => setViewDocs(app)}
                        style={{ width:"100%",background:"none",border:"1px solid #e8e8e8",borderRadius:8,color:"#555",padding:"9px",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontWeight:500 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="#000"; e.currentTarget.style.color="#000"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="#e8e8e8"; e.currentTarget.style.color="#555"; }}>
                        📄 View Documents ({(app.documents||[]).length}) — Download
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── SIDEBAR */}
      <div style={S.sb}>
        <div style={{ padding:"22px 22px 18px",borderBottom:"1px solid #f0f0f0" }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,letterSpacing:-.5,color:"#000" }}>MAS <span style={{ fontWeight:300,color:"#aaa" }}>Freight</span></div>
          <span style={{ fontSize:11,color:"#bbb",letterSpacing:2,display:"block",marginTop:2 }}>DISPATCHER PORTAL</span>
        </div>
        <div style={{ flex:1,padding:"14px 10px" }}>
          <NavBtn id="dashboard" ico="📊" lbl="Dashboard"/>
          <NavBtn id="loads"     ico="📦" lbl="Loads"/>
          <NavBtn id="registrations" ico="🚛" lbl="Registrations" badge={pendingCount}/>
          <NavBtn id="fleet"     ico="🔍" lbl="Fleet Registry"/>
          <NavBtn id="analytics" ico="📈" lbl="Analytics"/>
          <NavBtn id="settings"  ico="⚙️" lbl="Settings"/>
        </div>
        <div style={{ padding:"14px 10px 22px",borderTop:"1px solid #f0f0f0" }}>
          {/* Notification bell */}
          <button onClick={() => setShowNotifs(true)}
            style={{ display:"flex",alignItems:"center",gap:9,padding:"10px 11px",borderRadius:10,cursor:"pointer",color:"#bbb",background:"none",border:"none",width:"100%",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,marginBottom:8,position:"relative" }}>
            <span style={{ fontSize:16,width:20,textAlign:"center" }}>🔔</span>
            Notifications
            {unread > 0 && <span style={{ marginLeft:"auto",background:"#c0392b",color:"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"2px 7px" }}>{unread}</span>}
          </button>
          <div style={{ display:"flex",alignItems:"center",gap:9,padding:"0 8px",marginBottom:14 }}>
            <div style={{ width:34,height:34,borderRadius:"50%",background:"#000",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:900,flexShrink:0 }}>M</div>
            <div><div style={{ fontSize:13,fontWeight:600 }}>Mohammed</div><div style={{ fontSize:11,color:"#bbb" }}>Administrator</div></div>
          </div>
          <button onClick={onLogout}
            style={{ width:"100%",background:"none",border:"1px solid #ebebeb",borderRadius:9,color:"#888",padding:"10px",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#000"; e.currentTarget.style.color="#000"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#ebebeb"; e.currentTarget.style.color="#888"; }}>
            ← Back to Website
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT */}
      <div style={S.main}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
          <div>
            <div style={S.ptitle}>
              {nav==="dashboard"?"Dashboard":nav==="loads"?"Loads":nav==="registrations"?"New Registrations":nav==="fleet"?"Fleet Registry":nav==="analytics"?"Analytics":"Settings"}
            </div>
            <div style={S.psub}>Live data · {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
          </div>
          <button onClick={() => setShowPost(true)}
            style={{ background:"#000",color:"#fff",border:"none",borderRadius:10,padding:"11px 22px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:800,cursor:"pointer" }}>
            ＋ Post New Load
          </button>
        </div>

        {loading && <div style={{ textAlign:"center",color:"#bbb",padding:60 }}>Loading...</div>}

        {/* ── DASHBOARD */}
        {!loading && nav==="dashboard" && <>
          <div style={S.statsRow}>
            <div style={S.stbox}><div style={S.stlbl}>ACTIVE LOADS</div><div style={S.stval}>{stats?.loads?.active||0}</div><div style={{ fontSize:11,color:"#bbb",marginTop:5 }}>{stats?.loads?.closed||0} closed</div></div>
            <div style={{ ...S.stbox,cursor:"pointer" }} onClick={() => setShowFleet(true)} onMouseEnter={e=>e.currentTarget.style.borderColor="#000"} onMouseLeave={e=>e.currentTarget.style.borderColor="#ebebeb"}>
              <div style={S.stlbl}>REGISTERED TRUCKS</div>
              <div style={S.stval}>{(stats?.trucks?.active||0)+(stats?.trucks?.on_trip||0)+(stats?.trucks?.inactive||0)}</div>
              <div style={{ fontSize:11,color:"#000",fontWeight:600,marginTop:5 }}>🔍 Search fleet →</div>
            </div>
            <div style={S.stbox}><div style={S.stlbl}>ACCEPTED TRIPS</div><div style={S.stval}>{stats?.applications?.accepted||0}</div><div style={{ fontSize:11,color:"#bbb",marginTop:5 }}>{stats?.applications?.pending||0} pending</div></div>
            <div style={{ ...S.stbox,cursor:pendingCount>0?"pointer":"default",borderColor:pendingCount>0?"#e67e22":"#ebebeb" }} onClick={() => pendingCount>0 && setNav("registrations")} onMouseEnter={e=>pendingCount>0&&(e.currentTarget.style.borderColor="#000")} onMouseLeave={e=>(e.currentTarget.style.borderColor=pendingCount>0?"#e67e22":"#ebebeb")}>
              <div style={S.stlbl}>PENDING REVIEW</div>
              <div style={{ ...S.stval,color:pendingCount>0?"#e67e22":"#000" }}>{pendingCount}</div>
              <div style={{ fontSize:11,color:pendingCount>0?"#e67e22":"#bbb",marginTop:5,fontWeight:pendingCount>0?600:400 }}>{pendingCount>0?"⚠ Review now →":"No pending"}</div>
            </div>
          </div>

          <div style={{ background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:20,marginBottom:20 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,marginBottom:16 }}>Monthly Revenue (ETB thousands)</div>
            <div style={{ display:"flex",alignItems:"flex-end",gap:8,height:100 }}>
              {BAR_DATA.map(b => (
                <div key={b.l} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                  <div style={{ width:"100%",borderRadius:"5px 5px 0 0",background:b.l==="Apr"?"#000":"#ebebeb",height:`${(b.v/maxBar)*85}px` }}/>
                  <div style={{ fontSize:11,color:"#bbb" }}>{b.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.tbox}>
            <div style={S.tboxHdr}><div style={S.tboxT}>Recent Loads</div><button onClick={() => setNav("loads")} style={{ background:"none",border:"1px solid #e8e8e8",borderRadius:8,color:"#bbb",fontSize:12,padding:"5px 13px",cursor:"pointer" }}>View all</button></div>
            {loads.filter(l => l.status!=="deleted").slice(0,4).map(l => (
              <div key={l.id} style={S.tr} onClick={() => openLoad(l)} onMouseEnter={e=>e.currentTarget.style.background="#fafafa"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:900,width:78,flexShrink:0 }}>{l.cargo}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{l.pickup_city} → {l.dropoff_city}</div>
                  <div style={{ fontSize:11,color:"#bbb",marginTop:1 }}>{l.distance_km}km · {l.weight_quintal}q · {l.commission_pct}% comm{l.broker_name ? ` · ${l.broker_name}` : ""}{l.loading_start ? ` · 📅 ${new Date(l.loading_start).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}` : ""}</div>
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:800,width:46,textAlign:"center",flexShrink:0 }}>{l.applicant_count||0}<span style={{ fontSize:10,color:"#bbb",fontWeight:400 }}> apps</span></div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:800,width:90,textAlign:"right",flexShrink:0 }}>
                  {(parseFloat(l.weight_quintal||0)*parseFloat(l.price_per_quintal||0)).toLocaleString()}<span style={{ fontSize:10,color:"#bbb",fontWeight:400 }}> ETB</span>
                </div>
                <div style={{ fontSize:11,padding:"3px 9px",borderRadius:6,fontWeight:600,background:l.status==="active"?"#f0f0f0":"#fafafa",color:l.status==="active"?"#555":"#ccc",border:`1px solid ${l.status==="active"?"#e8e8e8":"#f0f0f0"}`,flexShrink:0 }}>{l.status}</div>
              </div>
            ))}
          </div>
        </>}

        {/* ── LOADS */}
        {!loading && nav==="loads" && (
          <div style={S.tbox}>
            <div style={S.tboxHdr}><div style={S.tboxT}>All Loads</div><div style={{ fontSize:12,color:"#bbb" }}>{loads.filter(l=>l.status!=="deleted").length} total</div></div>
            {loads.filter(l => l.status!=="deleted").map(l => (
              <div key={l.id} style={S.tr} onClick={() => openLoad(l)} onMouseEnter={e=>e.currentTarget.style.background="#fafafa"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:900,width:78,flexShrink:0 }}>{l.cargo}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{l.pickup_city} → {l.dropoff_city}</div>
                  <div style={{ fontSize:11,color:"#bbb",marginTop:1 }}>{l.distance_km}km · {l.weight_quintal}q · {l.commission_pct}%{l.broker_name ? ` · ${l.broker_name}` : ""}{l.loading_start ? ` · 📅 ${new Date(l.loading_start).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}` : ""} · {new Date(l.posted_at).toLocaleDateString()}</div>
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:800,width:46,textAlign:"center",flexShrink:0 }}>{l.applicant_count||0}<span style={{ fontSize:10,color:"#bbb",fontWeight:400 }}> apps</span></div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:800,width:100,textAlign:"right",flexShrink:0 }}>
                  {(parseFloat(l.weight_quintal||0)*parseFloat(l.price_per_quintal||0)).toLocaleString()}<span style={{ fontSize:10,color:"#bbb",fontWeight:400 }}> ETB</span>
                </div>
                <div style={{ fontSize:11,padding:"3px 9px",borderRadius:6,fontWeight:600,background:l.status==="active"?"#f0f0f0":l.status==="closed"?"#fff3cd":"#fafafa",color:l.status==="active"?"#555":l.status==="closed"?"#856404":"#ccc",border:"1px solid",borderColor:l.status==="active"?"#e8e8e8":l.status==="closed"?"#ffeeba":"#f0f0f0",flexShrink:0 }}>{l.status}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── REGISTRATIONS */}
        {!loading && nav==="registrations" && (
          <RegistrationsTab onViewDocs={t => setViewDocs(t)} onDataChange={loadAll}/>
        )}

        {/* ── FLEET */}
        {!loading && nav==="fleet" && (
          <div style={S.tbox}>
            <div style={S.tboxHdr}>
              <div style={S.tboxT}>All Registered Trucks</div>
              <button onClick={() => setShowFleet(true)} style={{ background:"#000",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:800,cursor:"pointer" }}>🔍 Search by Plate</button>
            </div>
            {fleet.filter(t => t.status!=="pending_review").map(t => (
              <div key={t.id} style={{ ...S.tr,cursor:"default" }} onMouseEnter={e=>e.currentTarget.style.background="#fafafa"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:900 }}>{t.plate_number}</div>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,color:"#bbb" }}>| {t.trailer_plate||"—"}</span>
                    <div style={{ fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:4,background:statusColor[t.status]||"#aaa",color:"#fff" }}>{statusLabel[t.status]||t.status}</div>
                  </div>
                  <div style={{ fontSize:12,color:"#888" }}>{t.driver_name} · {t.truck_type} · {t.truck_id||"Pending"}</div>
                </div>
                <div style={{ fontSize:13,color:"#888",flexShrink:0,marginRight:8 }}>{t.driver_phone_et||""}</div>
                <button onClick={() => setViewDocs(t)} style={{ background:"none",border:"1px solid #e8e8e8",borderRadius:8,color:"#555",padding:"5px 11px",fontSize:12,cursor:"pointer",flexShrink:0,fontFamily:"'DM Sans',sans-serif",fontWeight:500 }} onMouseEnter={e=>e.currentTarget.style.borderColor="#000"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e8e8e8"}>📄 Docs</button>
              </div>
            ))}
          </div>
        )}

        {/* ── ANALYTICS */}

        {/* ── SETTINGS ── */}
        {nav==="settings" && (
          <div style={{ maxWidth:520 }}>
            {/* Change Password */}
            <div style={{ background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:24,marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.03)" }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,marginBottom:16,color:"#000" }}>Change Password</div>
              {[["Current password","settingsCurPw",settingsCurPw,setSettingsCurPw,"password"],
                ["New password (min 6 chars)","settingsNewPw",settingsNewPw,setSettingsNewPw,"password"],
                ["Confirm new password","settingsConfPw",settingsConfPw,setSettingsConfPw,"password"]].map(([lbl,_,val,setter,type])=>(
                <div key={lbl} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11,color:"#bbb",letterSpacing:.5,fontWeight:600,marginBottom:5 }}>{lbl.toUpperCase()}</div>
                  <input value={val} onChange={e=>setter(e.target.value)} type={type} placeholder={lbl}
                    style={{ width:"100%",background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,color:"#000",padding:"12px 15px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none" }}/>
                </div>
              ))}
              {settingsPwMsg.text && <div style={{ fontSize:13,padding:"10px 14px",borderRadius:8,marginBottom:12,background:settingsPwMsg.type==="ok"?"#f0fff4":"#fff5f5",color:settingsPwMsg.type==="ok"?"#2d6a4f":"#c0392b",border:`1px solid ${settingsPwMsg.type==="ok"?"#b7efc5":"#fecaca"}` }}>{settingsPwMsg.text}</div>}
              <button onClick={async()=>{
                if(!settingsCurPw||!settingsNewPw||!settingsConfPw){setSettingsPwMsg({type:"err",text:"All fields required"});return}
                if(settingsNewPw!==settingsConfPw){setSettingsPwMsg({type:"err",text:"Passwords do not match"});return}
                if(settingsNewPw.length<6){setSettingsPwMsg({type:"err",text:"Min 6 characters"});return}
                setSettingsPwLoading(true);setSettingsPwMsg({type:"",text:""});
                try{
                  await Auth.changePassword(settingsCurPw, settingsNewPw);
                  const d = {success:true};
                  setSettingsPwMsg({type:"ok",text:"Password changed successfully ✓"});
                  setSettingsCurPw("");setSettingsNewPw("");setSettingsConfPw("");
                }catch(e){setSettingsPwMsg({type:"err",text:e.message});}
                finally{setSettingsPwLoading(false);}
              }} disabled={settingsPwLoading}
                style={{ background:"#000",color:"#fff",border:"none",borderRadius:10,padding:"12px",width:"100%",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:900,cursor:"pointer",opacity:settingsPwLoading?.7:1 }}>
                {settingsPwLoading?"CHANGING...":"CHANGE PASSWORD"}
              </button>
            </div>

            {/* Change Email */}
            <div style={{ background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:24,marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.03)" }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,marginBottom:16,color:"#000" }}>Change Login Email</div>
              {[["New email address","settingsNewEmail",settingsNewEmail,setSettingsNewEmail,"email"],
                ["Confirm with password","settingsEmailPw",settingsEmailPw,setSettingsEmailPw,"password"]].map(([lbl,_,val,setter,type])=>(
                <div key={lbl} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11,color:"#bbb",letterSpacing:.5,fontWeight:600,marginBottom:5 }}>{lbl.toUpperCase()}</div>
                  <input value={val} onChange={e=>setter(e.target.value)} type={type} placeholder={lbl}
                    style={{ width:"100%",background:"#f7f7f7",border:"1px solid #ebebeb",borderRadius:10,color:"#000",padding:"12px 15px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none" }}/>
                </div>
              ))}
              {settingsEmailMsg.text && <div style={{ fontSize:13,padding:"10px 14px",borderRadius:8,marginBottom:12,background:settingsEmailMsg.type==="ok"?"#f0fff4":"#fff5f5",color:settingsEmailMsg.type==="ok"?"#2d6a4f":"#c0392b",border:`1px solid ${settingsEmailMsg.type==="ok"?"#b7efc5":"#fecaca"}` }}>{settingsEmailMsg.text}</div>}
              <button onClick={async()=>{
                if(!settingsNewEmail||!settingsEmailPw){setSettingsEmailMsg({type:"err",text:"All fields required"});return}
                setSettingsEmailLoading(true);setSettingsEmailMsg({type:"",text:""});
                try{
                  await Auth.changeEmail(settingsNewEmail, settingsEmailPw);
                  const d = {success:true};
                  setSettingsEmailMsg({type:"ok",text:"Email updated. Use your new email next time you log in. ✓"});
                  setSettingsNewEmail("");setSettingsEmailPw("");
                }catch(e){setSettingsEmailMsg({type:"err",text:e.message});}
                finally{setSettingsEmailLoading(false);}
              }} disabled={settingsEmailLoading}
                style={{ background:"#000",color:"#fff",border:"none",borderRadius:10,padding:"12px",width:"100%",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:900,cursor:"pointer",opacity:settingsEmailLoading?.7:1 }}>
                {settingsEmailLoading?"UPDATING...":"UPDATE EMAIL"}
              </button>
            </div>
          </div>
        )}

                {!loading && nav==="analytics" && <>
          <div style={S.statsRow}>
            {[
              { l:"TOTAL LOADS", v:loads.filter(l=>l.status!=="deleted").length, u:"loads" },
              { l:"COMPLETION RATE", v:loads.length ? `${Math.round((stats?.loads?.completed||0)/loads.length*100)}` : "0", u:"%" },
              { l:"ON TRIP NOW", v:stats?.trucks?.on_trip||0, u:"trucks" },
              { l:"REVENUE (ETB)", v:((stats?.revenueETB||0)/1000).toFixed(0)+"k", u:"" },
            ].map(s => (
              <div key={s.l} style={S.stbox}><div style={S.stlbl}>{s.l}</div><div style={S.stval}>{s.v}<span style={{ fontSize:12,color:"#bbb",marginLeft:3 }}>{s.u}</span></div></div>
            ))}
          </div>
          <div style={{ background:"#fff",border:"1px solid #ebebeb",borderRadius:14,padding:20 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,marginBottom:16 }}>Weekly Load Activity</div>
            <div style={{ display:"flex",alignItems:"flex-end",gap:8,height:100 }}>
              {[{l:"Mon",v:3},{l:"Tue",v:5},{l:"Wed",v:4},{l:"Thu",v:7},{l:"Fri",v:6},{l:"Sat",v:8},{l:"Sun",v:2}].map(b => (
                <div key={b.l} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                  <div style={{ width:"100%",borderRadius:"5px 5px 0 0",background:b.l==="Sat"?"#000":"#ebebeb",height:`${(b.v/8)*85}px` }}/>
                  <div style={{ fontSize:11,color:"#bbb" }}>{b.l}</div>
                </div>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LOGIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AdminLoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !pass) { setErr("Please enter both fields."); return; }
    setLoading(true); setErr("");
    try {
      await Auth.login(email, pass);
      onSuccess();
    } catch (e) {
      setErr(e.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(10px)" }}>
      <div style={{ background:"#fff",borderRadius:20,padding:36,width:"100%",maxWidth:400,boxShadow:"0 32px 80px rgba(0,0,0,.3)" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900 }}>Admin Login</div>
            <div style={{ fontSize:13,color:"#bbb",marginTop:2 }}>MAS Freight Dispatcher Portal</div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:"50%",border:"1px solid #e8e8e8",background:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        {[["EMAIL","email","admin@masfreight.com","email"],["PASSWORD","pass","••••••••","password"]].map(([lbl,key,ph,type]) => (
          <div key={key} style={{ marginBottom:14 }}>
            <div style={{ fontSize:11,color:"#bbb",letterSpacing:.5,fontWeight:600,marginBottom:5 }}>{lbl}</div>
            <input value={key==="email"?email:pass} onChange={e => key==="email"?setEmail(e.target.value):setPass(e.target.value)}
              placeholder={ph} type={type} onKeyDown={e => e.key==="Enter"&&handle()}
              style={{ width:"100%",background:"#f7f7f7",border:"1px solid #e8e8e8",borderRadius:10,color:"#000",padding:"13px 15px",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none" }}/>
          </div>
        ))}
        {err && <div style={{ fontSize:13,color:"#c0392b",marginBottom:14,background:"#fff5f5",border:"1px solid #fecaca",borderRadius:8,padding:"10px 13px" }}>{err}</div>}
        <button onClick={handle} disabled={loading}
          style={{ width:"100%",background:"#000",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,cursor:loading?"default":"pointer",opacity:loading?.7:1 }}>
          {loading ? "SIGNING IN..." : "SIGN IN →"}
        </button>
        <div style={{ fontSize:12,color:"#ccc",textAlign:"center",marginTop:14 }}>admin@masfreight.com · admin123</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING WEBSITE
// ─────────────────────────────────────────────────────────────────────────────
function MarketingWebsite({ onAdminLogin }) {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeat, setActiveFeat] = useState(0);
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive:true });
    Stats.public().then(setLiveStats).catch(() => {});
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const features = [
    { icon:"📦", title:"Post & Find Loads", desc:"Dispatchers post freight orders with full details — cargo type, route, price per quintal, commission %, and description. Drivers discover loads near them instantly." },
    { icon:"📡", title:"Live GPS Tracking", desc:"Real-time truck tracking powered by Sinotrack. Dispatchers see every truck's location, speed, and movement history from one dashboard." },
    { icon:"💰", title:"Trip Finance & Profit", desc:"Drivers log every expense, commission is deducted automatically, and net profit is calculated per trip. Full financial transparency from pickup to delivery." },
    { icon:"🪪", title:"Document Management", desc:"All driver and truck documents — license, ID, Djibouti permits, truck & trailer registration — stored securely and downloadable." },
    { icon:"🌐", title:"Amharic & English", desc:"Full Amharic and English support across the driver app. Ethiopia's first logistics platform built for Ethiopian drivers, in their language." },
    { icon:"⚡", title:"Instant Applications", desc:"Built-in truck readiness check, apply-once protection, and legal terms acceptance. Only serious, verified operators get through." },
  ];

  const steps = [
    { n:"01", title:"Register your truck", desc:"Upload truck & trailer details, driver license, ID, and Djibouti permits. One account, all your trucks." },
    { n:"02", title:"Browse available loads", desc:"Filter freight orders by route. See rate per quintal, commission %, and full load description." },
    { n:"03", title:"Apply & get accepted", desc:"Confirm your truck is ready, accept terms, and submit. The dispatcher reviews your docs and accepts you." },
    { n:"04", title:"Track & get paid", desc:"GPS tracking keeps everyone informed. Log expenses, finish the trip, see your net profit automatically." },
  ];

  const displayStats = [
    [(liveStats?.totalTrucks||0)+"+", "Registered Trucks"],
    [(liveStats?.citiesCovered||0)+"", "Cities Covered"],
    ["2", "Countries Served"],
    [(liveStats?.activeLoads||0)+"+", "Active Loads Now"],
  ];

  const css = `
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
    html{scroll-behavior:smooth;}
    body{background:#08080a;color:#fff;font-family:'DM Sans',sans-serif;overflow-x:hidden;}
    ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0a0a0c;}::-webkit-scrollbar-thumb{background:#333;border-radius:3px;}
    .nav{position:fixed;top:0;left:0;right:0;z-index:90;transition:all .3s ease;}
    .nav.s{background:rgba(8,8,10,.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);}
    .nav-in{max-width:1200px;margin:0 auto;padding:0 32px;height:70px;display:flex;align-items:center;justify-content:space-between;}
    .nlogo{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;letter-spacing:-.5px;}
    .nlogo em{font-style:normal;font-weight:300;color:rgba(255,255,255,.4);}
    .nlinks{display:flex;gap:32px;align-items:center;}
    .nl{font-size:14px;font-weight:500;color:rgba(255,255,255,.5);transition:color .2s;cursor:pointer;text-decoration:none;}
    .nl:hover{color:#fff;}
    .nav-btns{display:flex;gap:10px;align-items:center;}
    .btn-admin{background:none;color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.18);padding:9px 18px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;}
    .btn-admin:hover{border-color:rgba(255,255,255,.6);color:#fff;}
    .btn-gs{background:#fff;color:#000;padding:10px 20px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;letter-spacing:.5px;cursor:pointer;border:none;}
    .btn-gs:hover{background:rgba(255,255,255,.9);transform:translateY(-1px);}
    .mob-btn{display:none;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;}
    .mob-menu{display:none;position:fixed;inset:0;top:70px;background:#080810;z-index:89;padding:32px;flex-direction:column;gap:24px;}
    .mob-menu.open{display:flex;}
    .hero{min-height:100vh;display:flex;flex-direction:column;padding-top:70px;position:relative;overflow:hidden;}
    .hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 100% 60% at 50% 0%,rgba(255,255,255,.03) 0%,transparent 70%);}
    .hero-cnt{position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:88px 32px 0;width:100%;}
    .h-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:5px 14px;font-size:12px;letter-spacing:2px;color:rgba(255,255,255,.5);text-transform:uppercase;margin-bottom:24px;}
    .h-title{font-family:'Barlow Condensed',sans-serif;font-size:clamp(58px,8vw,108px);font-weight:900;line-height:.87;letter-spacing:-3px;margin-bottom:24px;}
    .h-accent{display:block;color:rgba(255,255,255,.2);font-weight:300;font-size:.55em;letter-spacing:2px;margin-top:8px;}
    .h-sub{font-size:17px;color:rgba(255,255,255,.44);max-width:440px;line-height:1.7;margin-bottom:40px;}
    .btn-p{background:#fff;color:#000;padding:14px 26px;border-radius:10px;font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;letter-spacing:.5px;cursor:pointer;border:none;}
    .btn-p:hover{background:rgba(255,255,255,.9);transform:translateY(-2px);}
    section{padding:96px 0;}
    .cont{max-width:1200px;margin:0 auto;padding:0 32px;}
    .eyebrow{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:4px;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:14px;}
    .sec-t{font-family:'Barlow Condensed',sans-serif;font-size:clamp(40px,5vw,66px);font-weight:900;line-height:.9;letter-spacing:-2px;margin-bottom:18px;}
    .sec-s{font-size:16px;color:rgba(255,255,255,.42);line-height:1.7;max-width:500px;}
    .feat-lay{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;margin-top:56px;}
    .feat-list{display:flex;flex-direction:column;gap:4px;}
    .fi{padding:16px 18px;border-radius:12px;cursor:pointer;border:1px solid transparent;}
    .fi:hover{background:rgba(255,255,255,.04);}
    .fi.on{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1);}
    .fi-hdr{display:flex;align-items:center;gap:11px;margin-bottom:7px;}
    .fi-ico{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
    .fi-t{font-family:'Barlow Condensed',sans-serif;font-size:19px;font-weight:800;}
    .fi-d{font-size:13px;color:rgba(255,255,255,.42);line-height:1.65;padding-left:45px;display:none;}
    .fi.on .fi-d{display:block;}
    .feat-vis{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:36px;position:sticky;top:90px;}
    .how-bg{background:rgba(255,255,255,.015);}
    .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:56px;}
    .sc{padding:26px 22px;border:1px solid rgba(255,255,255,.07);border-radius:16px;background:rgba(255,255,255,.02);}
    .sc:hover{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);transform:translateY(-4px);}
    .sc-n{font-family:'Barlow Condensed',sans-serif;font-size:56px;font-weight:900;color:rgba(255,255,255,.07);line-height:1;margin-bottom:14px;}
    .sc-t{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;margin-bottom:9px;}
    .sc-d{font-size:13px;color:rgba(255,255,255,.42);line-height:1.65;}
    .apps-lay{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:56px;}
    .ac{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:40px;}
    .ac:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14);transform:translateY(-4px);}
    .ac-tag{display:inline-block;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.32);text-transform:uppercase;background:rgba(255,255,255,.06);padding:4px 11px;border-radius:11px;margin-bottom:18px;}
    .ac-t{font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:900;margin-bottom:13px;letter-spacing:-1px;}
    .ac-d{font-size:14px;color:rgba(255,255,255,.42);line-height:1.7;margin-bottom:26px;}
    .ac-fl{display:flex;flex-direction:column;gap:9px;}
    .ac-fr{display:flex;align-items:center;gap:9px;font-size:13px;color:rgba(255,255,255,.55);}
    .ck{width:19px;height:19px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
    .cta-s{text-align:center;padding:110px 0;position:relative;overflow:hidden;}
    .cta-bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(255,255,255,.04) 0%,transparent 70%);}
    .cta-t{font-family:'Barlow Condensed',sans-serif;font-size:clamp(50px,7vw,88px);font-weight:900;line-height:.9;letter-spacing:-3px;margin-bottom:18px;position:relative;z-index:1;}
    .cta-s2{font-size:17px;color:rgba(255,255,255,.42);margin-bottom:44px;position:relative;z-index:1;}
    footer{border-top:1px solid rgba(255,255,255,.07);padding:56px 0 36px;}
    .ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:44px;}
    .ft-logo{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;margin-bottom:10px;}
    .ft-logo em{font-style:normal;font-weight:300;color:rgba(255,255,255,.28);}
    .ft-tag{font-size:13px;color:rgba(255,255,255,.3);line-height:1.6;}
    .ft-ct{font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.28);text-transform:uppercase;margin-bottom:14px;font-weight:600;}
    .ft-lk{display:block;font-size:13px;color:rgba(255,255,255,.4);margin-bottom:9px;cursor:pointer;}
    .ft-lk:hover{color:#fff;}
    .ft-bot{display:flex;justify-content:space-between;align-items:center;padding-top:26px;border-top:1px solid rgba(255,255,255,.06);}
    @media(max-width:900px){.nlinks{display:none;}.mob-btn{display:block;}.feat-lay,.apps-lay{grid-template-columns:1fr;}.feat-vis{display:none;}.steps{grid-template-columns:1fr 1fr;}.ft-top{grid-template-columns:1fr 1fr;}.nav-btns{gap:6px;}.btn-admin{padding:7px 12px;font-size:12px;}}
    @media(max-width:600px){.steps,.ft-top{grid-template-columns:1fr;}}
  `;

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "mw-styles";
    s.textContent = css;
    const ex = document.getElementById("mw-styles");
    if (ex) ex.remove();
    document.head.appendChild(s);
    return () => document.getElementById("mw-styles")?.remove();
  }, []);

  return (
    <div style={{ minHeight:"100vh",background:"#08080a" }}>
      <nav className={`nav${scrollY>40?" s":""}`}>
        <div className="nav-in">
          <div className="nlogo">MAS <em>Freight</em></div>
          <div className="nlinks">
            <a className="nl" href="#features">Features</a>
            <a className="nl" href="#how-it-works">How It Works</a>
            <a className="nl" href="#platform">Platform</a>
            <a className="nl" href="#about">About</a>
          </div>
          <div className="nav-btns">
            <button className="btn-admin" onClick={onAdminLogin}>Admin Login</button>
            <button className="btn-gs">Get Started</button>
          </div>
          <button className="mob-btn" onClick={() => setMenuOpen(v=>!v)}>☰</button>
        </div>
        {menuOpen && (
          <div className={`mob-menu${menuOpen?" open":""}`}>
            {["Features","How It Works","Platform","About"].map(l => (
              <a key={l} style={{ fontSize:22,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:"#fff",textDecoration:"none" }} href={`#${l.toLowerCase().replace(/ /g,"-")}`} onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <button className="btn-admin" onClick={() => { setMenuOpen(false); onAdminLogin(); }}>Admin Login</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"/>
        <div className="hero-cnt">
          <div className="h-badge">🇪🇹 Built for Ethiopia</div>
          <h1 className="h-title">
            Ethiopia's<br/>Freight Network
            <span className="h-accent">Moving Ethiopia Forward</span>
          </h1>
          <p className="h-sub">Connect truck owners with freight dispatchers. Real-time GPS, transparent pricing, digital documents — all in one platform.</p>
          <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            <button className="btn-p">Download Driver App</button>
            <button onClick={onAdminLogin}
              style={{ background:"none",color:"rgba(255,255,255,.7)",border:"1px solid rgba(255,255,255,.2)",padding:"14px 26px",borderRadius:10,fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="rgba(255,255,255,.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,.7)"; e.currentTarget.style.borderColor="rgba(255,255,255,.2)"; }}>
              Admin Login →
            </button>
          </div>
        </div>

        {/* Live stats bar */}
        <div style={{ position:"relative",zIndex:2,maxWidth:1200,margin:"60px auto 0",padding:"0 32px",width:"100%" }}>
          <div style={{ background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,padding:"32px 36px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,overflow:"hidden" }}>
            {displayStats.map(([v,l],i) => (
              <div key={l} style={{ padding:"28px 20px",textAlign:"center",borderRight:i<3?"1px solid rgba(255,255,255,.06)":"none" }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:50,fontWeight:900,lineHeight:1,marginBottom:5 }}>{v}</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,.35)",letterSpacing:1 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:6,fontSize:11,color:"rgba(255,255,255,.2)",textAlign:"right",letterSpacing:1 }}>LIVE DATA FROM DISPATCHER</div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="cont">
          <div className="eyebrow">Platform Features</div>
          <h2 className="sec-t">Everything you need,<br/>nothing you don't.</h2>
          <p className="sec-s">MAS Freight is purpose-built for the Ethiopia–Djibouti freight corridor.</p>
          <div className="feat-lay">
            <div className="feat-list">
              {features.map((f,i) => (
                <div key={i} className={`fi${activeFeat===i?" on":""}`} onClick={() => setActiveFeat(i)}>
                  <div className="fi-hdr"><div className="fi-ico">{f.icon}</div><div className="fi-t">{f.title}</div></div>
                  <div className="fi-d">{f.desc}</div>
                </div>
              ))}
            </div>
            <div className="feat-vis">
              <div style={{ fontSize:52,marginBottom:16 }}>{features[activeFeat].icon}</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,marginBottom:10 }}>{features[activeFeat].title}</div>
              <div style={{ fontSize:14,color:"rgba(255,255,255,.45)",lineHeight:1.7 }}>{features[activeFeat].desc}</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-bg">
        <div className="cont">
          <div className="eyebrow">How It Works</div>
          <h2 className="sec-t">From parked truck<br/>to paid trip.</h2>
          <p className="sec-s">Four steps. Find a load, deliver, log expenses, see your profit.</p>
          <div className="steps">
            {steps.map(s => <div key={s.n} className="sc"><div className="sc-n">{s.n}</div><div className="sc-t">{s.title}</div><div className="sc-d">{s.desc}</div></div>)}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform">
        <div className="cont">
          <div className="eyebrow">Two Platforms, One Ecosystem</div>
          <h2 className="sec-t">Built for drivers.<br/>Built for dispatchers.</h2>
          <div className="apps-lay">
            <div className="ac">
              <div className="ac-tag">Driver App · Mobile</div>
              <div className="ac-t">For Truck<br/>Owners</div>
              <div className="ac-d">A bilingual mobile app for drivers to browse loads, track GPS, manage trip finances, and handle documents in Amharic or English.</div>
              <div className="ac-fl">
                {["Browse & filter freight orders by route","Price per quintal + commission breakdown","Live GPS via Sinotrack","Per-trip expense tracker & profit calculator","Multi-truck + trailer management","Document upload: license, ID, Djibouti permit"].map(f => <div key={f} className="ac-fr"><div className="ck">✓</div>{f}</div>)}
              </div>
              <button className="btn-p" style={{ marginTop:28,width:"100%" }}>Download Driver App</button>
            </div>
            <div className="ac">
              <div className="ac-tag">Dispatcher Portal · Web</div>
              <div className="ac-t">For Freight<br/>Dispatchers</div>
              <div className="ac-d">A powerful web dashboard for posting loads, reviewing applicants, verifying documents, approving registrations, and tracking the fleet.</div>
              <div className="ac-fl">
                {["Post loads with description, commission %, slots","Review & approve truck registrations","Accept drivers, call them, view GPS","Fleet registry: search truck or trailer by plate","PDF document viewer & download","Live stats: trucks, routes, revenue"].map(f => <div key={f} className="ac-fr"><div className="ck">✓</div>{f}</div>)}
              </div>
              <button onClick={onAdminLogin}
                style={{ marginTop:28,width:"100%",background:"none",color:"#fff",border:"1px solid rgba(255,255,255,.2)",padding:"14px",borderRadius:10,fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,cursor:"pointer" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,.5)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="rgba(255,255,255,.2)"}>
                Admin Login →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background:"rgba(255,255,255,.015)" }}>
        <div className="cont">
          <div className="eyebrow">From the Road</div>
          <h2 className="sec-t">What operators say.</h2>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,marginTop:52 }}>
            {[{name:"Abebe G.",role:"Truck Owner, Addis Ababa",q:"Before MAS Freight I spent days calling brokers. Now I find loads in minutes and track my profit on every trip."},
              {name:"Tesfaye W.",role:"Fleet Dispatcher, Dire Dawa",q:"Managing 12 trucks used to be a nightmare. The dashboard shows me everything — applicants, documents, GPS — from one screen."},
              {name:"Mulugeta H.",role:"Owner-Operator, Bahir Dar",q:"The Amharic language support made all the difference. My drivers use the app without any training."}].map(t => (
              <div key={t.name} style={{ background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:28 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:56,color:"rgba(255,255,255,.08)",lineHeight:.8,marginBottom:14 }}>"</div>
                <div style={{ fontSize:15,color:"rgba(255,255,255,.55)",lineHeight:1.7,marginBottom:22,fontStyle:"italic" }}>{t.q}</div>
                <div style={{ fontSize:14,fontWeight:600 }}>{t.name}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,.3)",marginTop:2 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-s">
        <div className="cta-bg"/>
        <div className="cont">
          <h2 className="cta-t">Your next load<br/>is waiting.</h2>
          <p className="cta-s2">Join Ethiopia's fastest-growing logistics platform. Register your truck today.</p>
          <button className="btn-p" style={{ fontSize:18,padding:"15px 32px" }}>Download Driver App</button>
          <div style={{ marginTop:32,fontSize:12,color:"rgba(255,255,255,.18)",letterSpacing:1 }}>FREE TO JOIN · COMMISSION ONLY ON COMPLETED LOADS</div>
        </div>
      </section>

      <footer>
        <div className="cont">
          <div className="ft-top">
            <div><div className="ft-logo">MAS <em>Freight</em></div><div className="ft-tag">Ethiopia's premier digital freight platform. Connecting truck owners with dispatchers across the Ethiopia–Djibouti corridor.</div></div>
            <div><div className="ft-ct">Platform</div><a className="ft-lk">Driver App</a><a className="ft-lk">GPS Tracking</a><a className="ft-lk">Fleet Registry</a></div>
            <div><div className="ft-ct">Company</div><a className="ft-lk">About MAS</a><a className="ft-lk">How It Works</a><a className="ft-lk">Contact</a><a className="ft-lk">Careers</a></div>
            <div><div className="ft-ct">Legal</div><a className="ft-lk">Terms & Conditions</a><a className="ft-lk">Privacy Policy</a><a className="ft-lk">Driver Agreement</a></div>
          </div>
          <div className="ft-bot">
            <div style={{ fontSize:12,color:"rgba(255,255,255,.22)" }}>© {new Date().getFullYear()} MAS Freight. All rights reserved.</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.28)" }}>🇪🇹 Made in Ethiopia</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function MASFreightSite() {
  const [view, setView] = useState("website");
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    if (Auth.isLoggedIn()) {
      Auth.me().then(() => setView("dispatcher")).catch(() => Auth.logout());
    }
  }, []);

  return (
    <>
      {view === "website" && <MarketingWebsite onAdminLogin={() => setShowAdminModal(true)}/>}
      {showAdminModal && (
        <AdminLoginModal
          onClose={() => setShowAdminModal(false)}
          onSuccess={() => { setShowAdminModal(false); setView("dispatcher"); }}
        />
      )}
      {view === "dispatcher" && <DispatcherPortal onLogout={() => { Auth.logout(); setView("website"); }}/>}
    </>
  );
}
