export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método no permitido" });

  const { id, nombre, correo, club, ...resto } = req.body;

  if (!id || !correo)
    return res.status(400).json({ error: "Faltan datos requeridos" });

  const repo = "proyectoja/asistencia-especialidades";
  const archivo = `respuestas/${id}/respuestas.json`;

  try {
    // 🔹 Leer archivo existente desde GitHub
    const respuesta = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    let registros = [];
    let sha;
    if (respuesta.ok) {
      const data = await respuesta.json();
      sha = data.sha;
      const decoded = Buffer.from(data.content, "base64").toString();
      registros = JSON.parse(decoded);
    }

    // 🔹 Buscar si ya existe este correo
    let usuario = registros.find(r => r.correo === correo);

    // 🟢 Si no existe, crear un nuevo registro con primera asistencia
    if (!usuario) {
      usuario = {
        id,
        nombre,
        correo,
        club,
        asistencias: { 1: true, 2: false, 3: false },
        fechaUltima: new Date().toISOString(),
        ...resto,
      };
      registros.push(usuario);
      var numeroAsistencia = 1;
    } 
    // 🟢 Si ya existe, actualizar la siguiente asistencia
    else {
      const asistencias = usuario.asistencias || { 1: false, 2: false, 3: false };
      const siguiente = Object.values(asistencias).filter(Boolean).length + 1;

      if (siguiente > 3) {
        return res.status(400).json({ error: "Ya registraste las 3 asistencias." });
      }

      asistencias[siguiente] = true;
      usuario.asistencias = asistencias;
      usuario.fechaUltima = new Date().toISOString();
      numeroAsistencia = siguiente;
    }

    // 🔹 Codificar y guardar en GitHub
    const contenidoBase64 = Buffer.from(JSON.stringify(registros, null, 2)).toString("base64");

    await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Actualización de asistencia ${numeroAsistencia} - ${correo}`,
        content: contenidoBase64,
        sha,
      }),
    });

    res.status(200).json({
      success: true,
      message: `✅ Asistencia ${numeroAsistencia} registrada correctamente.`,
      numeroAsistencia,
    });

  } catch (err) {
    console.error("Error al guardar:", err);
    res.status(500).json({ error: "Error al guardar la asistencia." });
  }
}
