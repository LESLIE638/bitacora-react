import * as XLSX from "xlsx";
import { useState, useEffect } from "react";

/* ─── STORAGE HELPERS ─── */
async function loadData() {
  try {
    const r = localStorage.getItem("vulkania_trabajadores");
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

async function saveData(data) {
  try {
    localStorage.setItem("vulkania_trabajadores", JSON.stringify(data));
  } catch {}
}

async function loadAgenda() {
  try {
    const r = localStorage.getItem("vulkania_agenda");
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

async function saveAgenda(data) {
  try {
    localStorage.setItem("vulkania_agenda", JSON.stringify(data));
  } catch {}
}

async function loadEquipos() {
  try {
    const r = localStorage.getItem("vulkania_equipos");
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

async function saveEquipos(data) {
  try {
    localStorage.setItem("vulkania_equipos", JSON.stringify(data));
  } catch {}
}

async function loadAvisos() {
  try {
    const r = localStorage.getItem("vulkania_avisos");
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

async function saveAvisos(data) {
  try {
    localStorage.setItem("vulkania_avisos", JSON.stringify(data));
  } catch {}
}

/* ─── UTILS ─── */
const fmt = (d) => d.toLocaleDateString("es-ES");
const fmtT = (d) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const fmtFull = (d) => d.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const diffHM = (entrada, salida) => {
  if (!entrada || !salida) return "—";
  const parse = (s) => { const [h, m, sec] = s.split(":").map(Number); return h * 60 + m + (sec || 0) / 60; };
  const diff = parse(salida) - parse(entrada);
  if (diff <= 0) return "—";
  return `${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`;
};
const totalHorasSemana = (historial) => {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
  lunes.setHours(0,0,0,0);
  let mins = 0;
  (historial || []).forEach(h => {
    if (!h.salida) return;
    const [d, m, y] = h.fecha.split("/").map(Number);
    const fecha = new Date(y, m - 1, d);
    if (fecha >= lunes) {
      const parse = (s) => { const [hh, mm] = s.split(":").map(Number); return hh * 60 + mm; };
      mins += parse(h.salida) - parse(h.entrada);
    }
  });
  return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
};

const ADMIN = { user: "admin", password: "vulkania123" };

const PRIORIDAD_COLOR = {
  Alta:   { bg: "#fde8e8", color: "#c0392b", border: "#f5c6c6" },
  Media:  { bg: "#fff8e1", color: "#b7770d", border: "#fde68a" },
  Baja:   { bg: "#e8f5e9", color: "#2e7d32", border: "#c8e6c9" },
};

/* ══════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════ */
export default function App() {
  const [agenda, setAgenda] = useState([]);
  const [nuevoEvento, setNuevoEvento] = useState({ fecha: "", hora: "", titulo: "", tipo: "reunión" });
  const [equipos, setEquipos] = useState([]);
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: "", miembros: [], actividad: "", hora: "", fecha: "", descripcion: "" });
  const [avisos, setAvisos] = useState([]);
  const [nuevoAviso, setNuevoAviso] = useState({ texto: "", prioridad: "Media" });
  const [ready, setReady] = useState(false);
  const [vista, setVista] = useState("");
  const [adminOK, setAdminOK] = useState(false);
  const [adminLogin, setAdminLogin] = useState({ user: "", pass: "" });
  const [trabajadores, setTrabajadores] = useState([]);
  const [nuevoTrabajador, setNuevoTrabajador] = useState("");
  const [nuevaPass, setNuevaPass] = useState("");
  const [nuevoCargo, setNuevoCargo] = useState("");
  const [login, setLogin] = useState({ nombre: "", pass: "" });
  const [usuario, setUsuario] = useState(null);
  const [verHistorial, setVerHistorial] = useState(null);
  const [toast, setToast] = useState(null);
  const [adminTab, setAdminTab] = useState("trabajadores");

  useEffect(() => { loadData().then((d) => { setTrabajadores(d); setReady(true); }); }, []);
  useEffect(() => { loadAgenda().then(setAgenda); }, []);
  useEffect(() => { loadEquipos().then(setEquipos); }, []);
  useEffect(() => { loadAvisos().then(setAvisos); }, []);
  useEffect(() => { if (ready) saveData(trabajadores); }, [trabajadores, ready]);
  useEffect(() => { saveAgenda(agenda); }, [agenda]);
  useEffect(() => { if (ready) saveEquipos(equipos); }, [equipos, ready]);
  useEffect(() => { saveAvisos(avisos); }, [avisos]);

  useEffect(() => {
  if (usuario) {
    const updated = trabajadores.find(
      (t) => t.nombre === usuario.nombre
    );
    // ...
  }
}, [usuario, trabajadores]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* ══════════ ADMIN ══════════ */
  const loginAdmin = () => {
    if (adminLogin.user === ADMIN.user && adminLogin.pass === ADMIN.password) setAdminOK(true);
    else showToast("Credenciales incorrectas", "err");
  };

  const agregarTrabajador = () => {
    const nombre = nuevoTrabajador.trim();
    const pass = nuevaPass.trim();
    const cargo = nuevoCargo.trim();
    if (!nombre || !pass) return showToast("Completa nombre y contraseña", "err");
    if (trabajadores.find((t) => t.nombre === nombre)) return showToast("Ya existe ese trabajador", "err");
    setTrabajadores((prev) => [...prev, { nombre, password: pass, cargo: cargo || "Colaborador", historial: [] }]);
    setNuevoTrabajador(""); setNuevaPass(""); setNuevoCargo("");
    showToast(`✔ ${nombre} agregado`);
  };

  const eliminarTrabajador = (nombre) => {
    if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
    setTrabajadores((prev) => prev.filter((t) => t.nombre !== nombre));
    showToast(`${nombre} eliminado`);
  };

  const exportarExcel = () => {
    const datos = [];
    trabajadores.forEach((t) => {
      (t.historial || []).forEach((h) => {
        datos.push({ Trabajador: t.nombre, Cargo: t.cargo || "—", Fecha: h.fecha, Entrada: h.entrada, Salida: h.salida || "—", "Horas trabajadas": h.salida ? diffHM(h.entrada, h.salida) : "—" });
      });
    });
    if (!datos.length) return showToast("No hay asistencias para exportar", "err");
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Asistencia");
    XLSX.writeFile(libro, "Vulkania_Asistencia.xlsx");
    showToast("Excel exportado ✔");
  };

  /* ══════════ PERSONAL ══════════ */
  const loginTrabajador = () => {
    const t = trabajadores.find((x) => x.nombre === login.nombre && x.password === login.pass);
    if (t) { setUsuario(t); setLogin({ nombre: "", pass: "" }); }
    else showToast("Usuario o contraseña incorrectos", "err");
  };

  const registrarEntrada = () => {
    const now = new Date();
    setTrabajadores((prev) => prev.map((t) => {
      if (t.nombre !== usuario.nombre) return t;
      const ultimo = t.historial?.[t.historial.length - 1];
      if (ultimo && !ultimo.salida) { showToast("Ya tienes una entrada activa", "err"); return t; }
      showToast("🟢 Entrada registrada");
      return { ...t, historial: [...(t.historial || []), { fecha: fmt(now), entrada: fmtT(now), salida: "" }] };
    }));
  };

  const registrarSalida = () => {
    const now = fmtT(new Date());
    let ok = false;
    setTrabajadores((prev) => prev.map((t) => {
      if (t.nombre !== usuario.nombre) return t;
      const ultimo = t.historial?.[t.historial.length - 1];
      if (!ultimo || ultimo.salida) { showToast("No hay entrada activa", "err"); return t; }
      ok = true;
      return { ...t, historial: t.historial.map((h, i) => i === t.historial.length - 1 ? { ...h, salida: now } : h) };
    }));
    if (ok) showToast("🔴 Salida registrada");
  };

  const estaActivo = (t) => { const u = t.historial?.[t.historial.length - 1]; return u && !u.salida; };

  const misEquipos = (nombre) => equipos.filter(eq => eq.miembros.includes(nombre));
  const misEventosHoy = () => {
    const hoy = fmt(new Date());
    return agenda.filter(e => e.fecha === hoy || e.fecha === new Date().toISOString().split("T")[0]);
  };

  if (!ready) return <div style={S.loading}>Cargando…</div>;

  return (
    <div style={S.root}>
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "err" ? "#f87171" : "#6ee7b7", color: toast.type === "err" ? "#7f1d1d" : "#064e3b" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <div style={S.logoMark}>V</div>
            <div>
              <div style={S.logoName}>VULKANIA</div>
              <div style={S.logoSub}>GESTIÓN DE PERSONAL</div>
            </div>
          </div>
          <div style={S.headerBadge}>Sistema Interno</div>
        </div>
      </header>

      {/* HOME */}
      {!vista && (
        <div style={S.home}>
          <div style={S.homeCard}>
            <div style={S.homeTitle}>Bienvenido</div>
            <div style={S.homeSubtitle}>Selecciona tu tipo de acceso para continuar</div>
            <div style={S.btnRow}>
              <button style={{ ...S.bigBtn, ...S.btnAdmin }} onClick={() => setVista("admin")}>
                <span style={S.btnIconWrap}>⚙️</span>
                <span style={S.bigBtnLabel}>Administrador</span>
                <span style={S.bigBtnSub}>Panel de control</span>
              </button>
              <button style={{ ...S.bigBtn, ...S.btnPersonal }} onClick={() => setVista("personal")}>
                <span style={S.btnIconWrap}>👤</span>
                <span style={S.bigBtnLabel}>Personal</span>
                <span style={S.bigBtnSub}>Registro de asistencia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ VISTA ADMIN ══ */}
      {vista === "admin" && (
        <div style={S.panel}>
          {!adminOK ? (
            <LoginForm title="Acceso Administrador" icon="⚙️"
              fields={[
                { ph: "Usuario", val: adminLogin.user, key: "user" },
                { ph: "Contraseña", val: adminLogin.pass, key: "pass", pw: true },
              ]}
              onChange={(k, v) => setAdminLogin((p) => ({ ...p, [k]: v }))}
              onSubmit={loginAdmin} onBack={() => setVista("")} />
          ) : (
            <>
              <div style={S.panelHeader}>
                <div>
                  <div style={S.panelTitle}>Panel Administrador</div>
                  <div style={S.panelSub}>{trabajadores.length} colaboradores · {trabajadores.filter(estaActivo).length} activos ahora</div>
                </div>
                <button style={S.outBtn} onClick={() => { setAdminOK(false); setVista(""); }}>Cerrar sesión</button>
              </div>

              <div style={S.tabs}>
                {[
                  { key: "trabajadores", label: "👥 Personal" },
                  { key: "asistencia",   label: "📋 Asistencia" },
                  { key: "agenda",       label: "📅 Agenda" },
                  { key: "equipos",      label: "🏗️ Equipos" },
                  { key: "avisos",       label: "📢 Avisos" },
                ].map(({ key, label }) => (
                  <button key={key} style={{ ...S.tab, ...(adminTab === key ? S.tabActive : {}) }} onClick={() => setAdminTab(key)}>
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Tab Trabajadores ── */}
              {adminTab === "trabajadores" && (
                <>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Agregar colaborador</div>
                    <div style={S.formGrid}>
                      <input style={S.input} placeholder="Nombre completo" value={nuevoTrabajador}
                        onChange={(e) => setNuevoTrabajador(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && agregarTrabajador()} />
                      <input style={S.input} placeholder="Cargo o puesto" value={nuevoCargo}
                        onChange={(e) => setNuevoCargo(e.target.value)} />
                      <input style={S.input} type="password" placeholder="Contraseña" value={nuevaPass}
                        onChange={(e) => setNuevaPass(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && agregarTrabajador()} />
                      <button style={S.primaryBtn} onClick={agregarTrabajador}>+ Agregar</button>
                    </div>
                  </div>

                  <div style={S.cardTitle}>Colaboradores registrados</div>
                  {trabajadores.length === 0 ? (
                    <EmptyState msg="No hay colaboradores registrados" />
                  ) : (
                    <div style={S.list}>
                      {trabajadores.map((t) => (
                        <div key={t.nombre} style={S.workerCard}>
                          <div style={S.workerLeft}>
                            <div style={{ ...S.avatar, background: estaActivo(t) ? "#bfdbfe" : "#e0e7ff" }}>
                              {t.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={S.workerName}>{t.nombre}</div>
                              <div style={S.workerCargo}>{t.cargo || "Colaborador"}</div>
                            </div>
                          </div>
                          <div style={S.workerRight}>
                            <span style={{ ...S.badge, ...(estaActivo(t) ? S.badgeGreen : S.badgeGray) }}>
                              {estaActivo(t) ? "● Activo" : "○ Inactivo"}
                            </span>
                            <span style={S.badgeMeta}>{t.historial?.length || 0} registros</span>
                            <button style={S.smBtn} onClick={() => setVerHistorial(verHistorial === t.nombre ? null : t.nombre)}>
                              {verHistorial === t.nombre ? "▲ Ocultar" : "▼ Historial"}
                            </button>
                            <button style={{ ...S.smBtn, ...S.delBtn }} onClick={() => eliminarTrabajador(t.nombre)}>✕</button>
                          </div>
                          {verHistorial === t.nombre && <HistorialTable historial={t.historial} />}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Tab Asistencia ── */}
              {adminTab === "asistencia" && (
                <>
                  <div style={S.statsGrid}>
                    <StatCard label="Total colaboradores" val={trabajadores.length} icon="👥" color="#dbeafe" />
                    <StatCard label="Activos ahora" val={trabajadores.filter(estaActivo).length} icon="🟢" color="#dcfce7" />
                    <StatCard label="Total registros" val={trabajadores.reduce((s, t) => s + (t.historial?.length || 0), 0)} icon="📋" color="#ede9fe" />
                  </div>
                  <div style={{ ...S.cardTitle, marginTop: 20 }}>Todos los registros</div>
                  <AllAttendance trabajadores={trabajadores} />
                  <button style={{ ...S.primaryBtn, marginTop: 16 }} onClick={exportarExcel}>📁 Exportar a Excel</button>
                </>
              )}

              {/* ── Tab Agenda ── */}
              {adminTab === "agenda" && (
                <>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Nuevo evento</div>
                    <div style={S.formGrid}>
                      <input type="date" style={S.input} value={nuevoEvento.fecha}
                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })} />
                      <input type="time" style={S.input} value={nuevoEvento.hora}
                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, hora: e.target.value })} />
                      <select style={S.input} value={nuevoEvento.tipo}
                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value })}>
                        {["Reunión","Capacitación","Entrega","Evento","Otro"].map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input style={S.input} placeholder="Descripción del evento" value={nuevoEvento.titulo}
                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, titulo: e.target.value })} />
                      <button style={S.primaryBtn}
                        onClick={() => {
                          if (!nuevoEvento.fecha || !nuevoEvento.hora || !nuevoEvento.titulo) return showToast("Completa todos los campos", "err");
                          setAgenda((prev) => [...prev, { ...nuevoEvento, creadoEn: fmtFull(new Date()) }]);
                          setNuevoEvento({ fecha: "", hora: "", titulo: "", tipo: "Reunión" });
                          showToast("Evento agregado ✔");
                        }}>
                        + Agregar evento
                      </button>
                    </div>
                  </div>

                  <div style={S.cardTitle}>Eventos programados</div>
                  {agenda.length === 0 ? <EmptyState msg="No hay eventos programados" /> : (
                    <div style={S.list}>
                      {[...agenda].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((e, i) => (
                        <div key={i} style={S.eventoRow}>
                          <div style={S.eventoLeft}>
                            <div style={S.eventoIconWrap}>{e.tipo === "Reunión" ? "🤝" : e.tipo === "Capacitación" ? "📚" : e.tipo === "Entrega" ? "📦" : "📌"}</div>
                            <div>
                              <div style={S.eventoTitulo}>{e.titulo}</div>
                              <div style={S.eventoMeta}>{e.tipo} · {e.fecha} a las {e.hora}</div>
                            </div>
                          </div>
                          <button style={{ ...S.smBtn, ...S.delBtn }} onClick={() => setAgenda((prev) => prev.filter((_, x) => x !== i))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Tab Equipos ── */}
              {adminTab === "equipos" && (
                <>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Crear equipo de trabajo</div>
                    <div style={S.formGrid}>
                      <input style={S.input} placeholder="Nombre del equipo" value={nuevoEquipo.nombre}
                        onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })} />
                      <input style={S.input} placeholder="Actividad o proyecto" value={nuevoEquipo.actividad}
                        onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, actividad: e.target.value })} />
                      <input style={S.input} placeholder="Descripción detallada (opcional)" value={nuevoEquipo.descripcion}
                        onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, descripcion: e.target.value })} />
                      <input type="date" style={S.input} value={nuevoEquipo.fecha}
                        onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, fecha: e.target.value })} />
                      <input type="time" style={S.input} value={nuevoEquipo.hora}
                        onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, hora: e.target.value })} />
                    </div>

                    <div style={{ ...S.cardTitle, fontSize: 12, marginTop: 8 }}>Seleccionar miembros</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      {trabajadores.map((t) => {
                        const sel = nuevoEquipo.miembros.includes(t.nombre);
                        return (
                          <button key={t.nombre}
                            style={{ padding: "6px 14px", border: `1.5px solid ${sel ? "#3b82f6" : "#cbd5e1"}`, borderRadius: 20, background: sel ? "#dbeafe" : "#f8fafc", color: sel ? "#1d4ed8" : "#64748b", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: sel ? 600 : 400, transition: "all 0.15s" }}
                            onClick={() => setNuevoEquipo((prev) => ({ ...prev, miembros: sel ? prev.miembros.filter((m) => m !== t.nombre) : [...prev.miembros, t.nombre] }))}>
                            {sel ? "✓ " : ""}{t.nombre}
                          </button>
                        );
                      })}
                      {trabajadores.length === 0 && <p style={S.empty}>Agrega trabajadores primero</p>}
                    </div>
                    <button style={S.primaryBtn}
                      onClick={() => {
                        if (!nuevoEquipo.nombre || !nuevoEquipo.actividad || !nuevoEquipo.hora || nuevoEquipo.miembros.length === 0)
                          return showToast("Completa todos los campos y selecciona miembros", "err");
                        setEquipos((prev) => [...prev, { ...nuevoEquipo, creadoEn: fmtFull(new Date()) }]);
                        setNuevoEquipo({ nombre: "", miembros: [], actividad: "", hora: "", fecha: "", descripcion: "" });
                        showToast("Equipo creado ✔");
                      }}>
                      + Crear equipo
                    </button>
                  </div>

                  <div style={S.cardTitle}>Equipos activos</div>
                  {equipos.length === 0 ? <EmptyState msg="No hay equipos creados" /> : (
                    <div style={S.list}>
                      {equipos.map((eq, i) => (
                        <div key={i} style={S.equipoCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={S.equipoNombre}>{eq.nombre}</div>
                              <div style={S.equipoActividad}>🛠️ {eq.actividad}</div>
                              {eq.descripcion && <div style={S.equipoDesc}>{eq.descripcion}</div>}
                              <div style={S.equipoMeta}>
                                {eq.fecha && `📅 ${eq.fecha} · `}⏰ {eq.hora}
                              </div>
                            </div>
                            <button style={{ ...S.smBtn, ...S.delBtn }} onClick={() => setEquipos((prev) => prev.filter((_, x) => x !== i))}>✕ Eliminar</button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                            {eq.miembros.map((m) => (
                              <span key={m} style={S.miembroPill}>👤 {m}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Tab Avisos ── */}
              {adminTab === "avisos" && (
                <>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Publicar aviso</div>
                    <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }}
                      placeholder="Escribe el aviso para todo el personal..."
                      value={nuevoAviso.texto}
                      onChange={(e) => setNuevoAviso({ ...nuevoAviso, texto: e.target.value })} />
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>Prioridad:</span>
                      {["Alta", "Media", "Baja"].map(p => (
                        <button key={p}
                          style={{ padding: "4px 14px", borderRadius: 20, border: `1.5px solid ${nuevoAviso.prioridad === p ? PRIORIDAD_COLOR[p].border : "#e2e8f0"}`, background: nuevoAviso.prioridad === p ? PRIORIDAD_COLOR[p].bg : "#f8fafc", color: nuevoAviso.prioridad === p ? PRIORIDAD_COLOR[p].color : "#94a3b8", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: nuevoAviso.prioridad === p ? 700 : 400 }}
                          onClick={() => setNuevoAviso({ ...nuevoAviso, prioridad: p })}>
                          {p}
                        </button>
                      ))}
                    </div>
                    <button style={{ ...S.primaryBtn, marginTop: 10 }}
                      onClick={() => {
                        if (!nuevoAviso.texto.trim()) return showToast("Escribe el aviso", "err");
                        setAvisos((prev) => [{ ...nuevoAviso, fecha: fmtFull(new Date()) }, ...prev]);
                        setNuevoAviso({ texto: "", prioridad: "Media" });
                        showToast("Aviso publicado ✔");
                      }}>
                      📢 Publicar aviso
                    </button>
                  </div>

                  <div style={S.cardTitle}>Avisos publicados</div>
                  {avisos.length === 0 ? <EmptyState msg="No hay avisos publicados" /> : (
                    <div style={S.list}>
                      {avisos.map((a, i) => (
                        <div key={i} style={{ ...S.avisoCard, borderLeft: `4px solid ${PRIORIDAD_COLOR[a.prioridad]?.border || "#e2e8f0"}`, background: PRIORIDAD_COLOR[a.prioridad]?.bg || "#f8fafc" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <span style={{ ...S.badge, background: PRIORIDAD_COLOR[a.prioridad]?.bg, color: PRIORIDAD_COLOR[a.prioridad]?.color, border: `1px solid ${PRIORIDAD_COLOR[a.prioridad]?.border}`, marginBottom: 6, display: "inline-block" }}>
                                {a.prioridad}
                              </span>
                              <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6 }}>{a.texto}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{a.fecha}</div>
                            </div>
                            <button style={{ ...S.smBtn, ...S.delBtn, flexShrink: 0 }} onClick={() => setAvisos((prev) => prev.filter((_, x) => x !== i))}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ VISTA PERSONAL ══ */}
      {vista === "personal" && (
        <div style={S.panel}>
          {!usuario ? (
            <LoginForm title="Acceso Personal" icon="👤"
              fields={[
                { ph: "Nombre", val: login.nombre, key: "nombre" },
                { ph: "Contraseña", val: login.pass, key: "pass", pw: true },
              ]}
              onChange={(k, v) => setLogin((p) => ({ ...p, [k]: v }))}
              onSubmit={loginTrabajador} onBack={() => setVista("")} />
          ) : (
            <WorkerPanel
              usuario={usuario}
              estaActivo={estaActivo(usuario)}
              onEntrada={registrarEntrada}
              onSalida={registrarSalida}
              onLogout={() => { setUsuario(null); setVista(""); }}
              misEquipos={misEquipos(usuario.nombre)}
              eventosHoy={misEventosHoy()}
              avisos={avisos}
              totalHoras={totalHorasSemana(usuario.historial)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   WORKER PANEL — Vista del trabajador
══════════════════════════════════════ */
function WorkerPanel({ usuario, estaActivo, onEntrada, onSalida, onLogout, misEquipos, eventosHoy, avisos, totalHoras }) {
  const [tab, setTab] = useState("inicio");
  const ultimo = usuario.historial?.[usuario.historial.length - 1];
  const hoy = usuario.historial?.filter((h) => h.fecha === new Date().toLocaleDateString("es-ES")) || [];
  const avisosAlta = avisos.filter(a => a.prioridad === "Alta");

  return (
    <>
      <div style={S.workerHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...S.avatar, width: 44, height: 44, fontSize: 18, background: "#bfdbfe" }}>
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={S.panelTitle}>{usuario.nombre}</div>
            <div style={S.panelSub}>{usuario.cargo || "Colaborador"}</div>
          </div>
        </div>
        <button style={S.outBtn} onClick={onLogout}>Cerrar sesión</button>
      </div>

      {avisosAlta.length > 0 && (
        <div style={{ background: "#fde8e8", border: "1px solid #f5c6c6", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#c0392b", marginBottom: 4 }}>⚠️ Aviso urgente</div>
          <div style={{ fontSize: 13, color: "#7f1d1d" }}>{avisosAlta[0].texto}</div>
        </div>
      )}

      <div style={S.statusCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: estaActivo ? "#22c55e" : "#cbd5e1", flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: estaActivo ? "#15803d" : "#64748b", fontWeight: 600 }}>
            {estaActivo ? `En turno desde las ${ultimo?.entrada}` : "Fuera de turno"}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Esta semana: {totalHoras}</div>
      </div>

      <div style={S.btnRow}>
        <button style={{ ...S.actionBtn, ...(estaActivo ? S.actionBtnDisabled : S.actionBtnGreen) }} onClick={onEntrada} disabled={estaActivo}>
          🟢 Registrar Entrada
        </button>
        <button style={{ ...S.actionBtn, ...(!estaActivo ? S.actionBtnDisabled : S.actionBtnRed) }} onClick={onSalida} disabled={!estaActivo}>
          🔴 Registrar Salida
        </button>
      </div>

      {/* Tabs del trabajador */}
      <div style={{ ...S.tabs, marginTop: 20 }}>
        {[
          { key: "inicio", label: "🏠 Inicio" },
          { key: "actividades", label: "🛠️ Mis actividades" },
          { key: "historial", label: "📋 Mi historial" },
          { key: "avisos", label: `📢 Avisos${avisos.length > 0 ? ` (${avisos.length})` : ""}` },
        ].map(({ key, label }) => (
          <button key={key} style={{ ...S.tab, ...(tab === key ? S.tabActive : {}) }} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "inicio" && (
        <>
          <div style={S.cardTitle}>Registros de hoy</div>
          {hoy.length === 0 ? <EmptyState msg="Sin registros hoy" /> : <HistorialTable historial={hoy} />}

          {eventosHoy.length > 0 && (
            <>
              <div style={{ ...S.cardTitle, marginTop: 16 }}>Agenda de hoy</div>
              <div style={S.list}>
                {eventosHoy.map((e, i) => (
                  <div key={i} style={S.eventoRow}>
                    <div style={S.eventoLeft}>
                      <div style={S.eventoIconWrap}>📌</div>
                      <div>
                        <div style={S.eventoTitulo}>{e.titulo}</div>
                        <div style={S.eventoMeta}>{e.tipo} · {e.hora}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "actividades" && (
        <>
          <div style={S.cardTitle}>Mis equipos de trabajo</div>
          {misEquipos.length === 0 ? (
            <EmptyState msg="No estás asignado a ningún equipo actualmente" />
          ) : (
            <div style={S.list}>
              {misEquipos.map((eq, i) => (
                <div key={i} style={S.equipoCard}>
                  <div style={S.equipoNombre}>{eq.nombre}</div>
                  <div style={S.equipoActividad}>🛠️ {eq.actividad}</div>
                  {eq.descripcion && <div style={S.equipoDesc}>{eq.descripcion}</div>}
                  <div style={S.equipoMeta}>
                    {eq.fecha && `📅 ${eq.fecha} · `}⏰ {eq.hora}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Compañeros de equipo:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {eq.miembros.map((m) => (
                        <span key={m} style={{ ...S.miembroPill, background: m === usuario.nombre ? "#bfdbfe" : "#f1f5f9", color: m === usuario.nombre ? "#1d4ed8" : "#475569", fontWeight: m === usuario.nombre ? 700 : 400 }}>
                          {m === usuario.nombre ? "★ " : ""}👤 {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ ...S.cardTitle, marginTop: 20 }}>Próximos eventos</div>
          {(() => {
            const hoyISO = new Date().toISOString().split("T")[0];
            const proximos = [...(eventosHoy || [])].filter(e => e.fecha >= hoyISO).slice(0, 5);
            return proximos.length === 0 ? <EmptyState msg="No hay eventos próximos" /> : (
              <div style={S.list}>
                {proximos.map((e, i) => (
                  <div key={i} style={S.eventoRow}>
                    <div style={S.eventoLeft}>
                      <div style={S.eventoIconWrap}>{e.tipo === "Reunión" ? "🤝" : e.tipo === "Capacitación" ? "📚" : "📌"}</div>
                      <div>
                        <div style={S.eventoTitulo}>{e.titulo}</div>
                        <div style={S.eventoMeta}>{e.tipo} · {e.fecha} a las {e.hora}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {tab === "historial" && (
        <>
          <div style={S.statsGrid}>
            <StatCard label="Registros totales" val={usuario.historial?.length || 0} icon="📋" color="#dbeafe" />
            <StatCard label="Esta semana" val={totalHoras} icon="⏱️" color="#dcfce7" />
          </div>
          <div style={{ ...S.cardTitle, marginTop: 16 }}>Mi historial completo</div>
          <HistorialTable historial={usuario.historial || []} />
        </>
      )}

      {tab === "avisos" && (
        <>
          <div style={S.cardTitle}>Avisos de la empresa</div>
          {avisos.length === 0 ? <EmptyState msg="No hay avisos publicados" /> : (
            <div style={S.list}>
              {avisos.map((a, i) => (
                <div key={i} style={{ ...S.avisoCard, borderLeft: `4px solid ${PRIORIDAD_COLOR[a.prioridad]?.border || "#e2e8f0"}`, background: PRIORIDAD_COLOR[a.prioridad]?.bg || "#f8fafc" }}>
                  <span style={{ ...S.badge, background: PRIORIDAD_COLOR[a.prioridad]?.bg, color: PRIORIDAD_COLOR[a.prioridad]?.color, border: `1px solid ${PRIORIDAD_COLOR[a.prioridad]?.border}`, marginBottom: 6, display: "inline-block" }}>
                    {a.prioridad}
                  </span>
                  <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6 }}>{a.texto}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{a.fecha}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ══════════════════════════════════════
   SUB-COMPONENTES
══════════════════════════════════════ */
function LoginForm({ title, icon, fields, onChange, onSubmit, onBack }) {
  return (
    <div style={S.loginBox}>
      <div style={S.loginIcon}>{icon}</div>
      <div style={S.panelTitle}>{title}</div>
      <div style={{ height: 8 }} />
      {fields.map((f) => (
        <input key={f.key} style={S.input} type={f.pw ? "password" : "text"}
          placeholder={f.ph} value={f.val}
          onChange={(e) => onChange(f.key, e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()} />
      ))}
      <button style={S.primaryBtn} onClick={onSubmit}>Ingresar →</button>
      <button style={S.outBtn} onClick={onBack}>← Volver</button>
    </div>
  );
}

function HistorialTable({ historial }) {
  const rows = [...historial].reverse();
  if (!rows.length) return <EmptyState msg="Sin registros" />;
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>{["Fecha", "Entrada", "Salida", "Duración"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((h, i) => (
            <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
              <td style={S.td}>{h.fecha}</td>
              <td style={{ ...S.td, color: "#16a34a", fontWeight: 600 }}>{h.entrada}</td>
              <td style={{ ...S.td, color: h.salida ? "#dc2626" : "#94a3b8", fontWeight: h.salida ? 600 : 400 }}>{h.salida || "activo"}</td>
              <td style={{ ...S.td, color: "#64748b" }}>{diffHM(h.entrada, h.salida)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllAttendance({ trabajadores }) {
  const all = [];
  trabajadores.forEach((t) => (t.historial || []).forEach((h) => all.push({ ...h, nombre: t.nombre, cargo: t.cargo })));
  all.sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (!all.length) return <EmptyState msg="Sin registros" />;
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>{["Colaborador", "Cargo", "Fecha", "Entrada", "Salida", "Duración"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {all.map((h, i) => (
            <tr key={i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
              <td style={{ ...S.td, fontWeight: 600 }}>{h.nombre}</td>
              <td style={{ ...S.td, color: "#64748b" }}>{h.cargo || "—"}</td>
              <td style={S.td}>{h.fecha}</td>
              <td style={{ ...S.td, color: "#16a34a", fontWeight: 600 }}>{h.entrada}</td>
              <td style={{ ...S.td, color: h.salida ? "#dc2626" : "#94a3b8" }}>{h.salida || "activo"}</td>
              <td style={{ ...S.td, color: "#64748b" }}>{diffHM(h.entrada, h.salida)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, val, icon, color }) {
  return (
    <div style={{ ...S.statBox, background: color }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>{val}</div>
      <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>{label}</div>
    </div>
  );
}

function EmptyState({ msg }) {
  return <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>— {msg} —</div>;
}

/* ══════════════════════════════════════
   ESTILOS — Paleta pastel azul corporativa
══════════════════════════════════════ */
const S = {
  root: { background: "#f0f4f8", color: "#1e293b", fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4f8", color: "#64748b" },
  toast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: 13, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", letterSpacing: 0.3 },

  header: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  headerInner: { maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoMark: { width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, letterSpacing: -1 },
  logoName: { fontWeight: 800, fontSize: 16, color: "#1e293b", letterSpacing: 2 },
  logoSub: { fontSize: 10, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase" },
  headerBadge: { background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 },

  home: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: 24 },
  homeCard: { background: "#fff", borderRadius: 20, padding: "48px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 480, width: "100%", textAlign: "center" },
  homeTitle: { fontSize: 26, fontWeight: 800, color: "#1e293b", marginBottom: 8 },
  homeSubtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 32 },

  btnRow: { display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" },
  bigBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "24px 32px", border: "2px solid", borderRadius: 16, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", flex: 1, minWidth: 140 },
  btnAdmin: { background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" },
  btnPersonal: { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#15803d" },
  btnIconWrap: { fontSize: 32 },
  bigBtnLabel: { fontWeight: 700, fontSize: 14, letterSpacing: 0.5 },
  bigBtnSub: { fontSize: 11, color: "#94a3b8", fontWeight: 400 },

  panel: { maxWidth: 800, margin: "0 auto", padding: "24px 16px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  workerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, background: "#fff", borderRadius: 14, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  panelTitle: { fontWeight: 800, fontSize: 18, color: "#1e293b" },
  panelSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  loginBox: { maxWidth: 380, margin: "40px auto", background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 12 },
  loginIcon: { fontSize: 40, textAlign: "center", marginBottom: 4 },

  input: { background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, color: "#1e293b", padding: "10px 14px", fontFamily: "inherit", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s" },

  primaryBtn: { background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", color: "#fff", padding: "11px 22px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, letterSpacing: 0.3, boxShadow: "0 2px 8px rgba(99,102,241,0.3)" },
  outBtn: { background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500 },

  tabs: { display: "flex", marginBottom: 20, background: "#fff", borderRadius: 12, padding: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", flexWrap: "wrap", gap: 2 },
  tab: { background: "transparent", border: "none", color: "#94a3b8", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500, borderRadius: 8, transition: "all 0.15s" },
  tabActive: { background: "#eff6ff", color: "#3b82f6", fontWeight: 700 },

  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 },
  formGrid: { display: "flex", flexDirection: "column", gap: 10 },

  list: { display: "flex", flexDirection: "column", gap: 10 },

  workerCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  workerLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1 },
  workerRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  workerName: { fontWeight: 700, fontSize: 15, color: "#1e293b" },
  workerCargo: { fontSize: 12, color: "#94a3b8" },

  avatar: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#1d4ed8", flexShrink: 0 },

  badge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4 },
  badgeGreen: { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" },
  badgeGray: { background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" },
  badgeMeta: { fontSize: 11, color: "#94a3b8" },

  smBtn: { background: "#f1f5f9", color: "#475569", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, border: "1px solid #e2e8f0" },
  delBtn: { background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626" },

  statusCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },

  actionBtn: { flex: 1, padding: "14px 0", border: "2px solid", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, transition: "all 0.15s" },
  actionBtnGreen: { background: "#f0fdf4", borderColor: "#86efac", color: "#15803d" },
  actionBtnRed: { background: "#fff1f2", borderColor: "#fca5a5", color: "#dc2626" },
  actionBtnDisabled: { background: "#f8fafc", borderColor: "#e2e8f0", color: "#cbd5e1", cursor: "not-allowed" },

  eventoRow: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  eventoLeft: { display: "flex", alignItems: "center", gap: 12 },
  eventoIconWrap: { fontSize: 22, width: 36, height: 36, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  eventoTitulo: { fontWeight: 600, fontSize: 14, color: "#1e293b" },
  eventoMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  equipoCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  equipoNombre: { fontWeight: 800, fontSize: 15, color: "#1e293b", marginBottom: 4 },
  equipoActividad: { fontSize: 13, color: "#3b82f6", fontWeight: 600, marginBottom: 4 },
  equipoDesc: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  equipoMeta: { fontSize: 12, color: "#94a3b8" },

  miembroPill: { background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 500 },

  avisoCard: { borderRadius: 12, padding: "14px 16px" },

  statsGrid: { display: "flex", gap: 12, flexWrap: "wrap" },
  statBox: { flex: 1, minWidth: 120, borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },

  tableWrap: { overflowX: "auto", width: "100%", borderRadius: 10, border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { background: "#f8fafc", padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "10px 14px", fontSize: 13, color: "#1e293b", borderBottom: "1px solid #f1f5f9" },
  trEven: { background: "#fff" },
  trOdd: { background: "#fafbfc" },

  empty: { color: "#94a3b8", fontSize: 13, fontStyle: "italic" },
}