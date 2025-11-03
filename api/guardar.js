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
    if (respuesta.ok) {
      const data = await respuesta.json();
      const decoded = Buffer.from(data.content, "base64").toString();
      registros = JSON.parse(decoded);
    }

    // 🔹 Buscar si ya existe este correo
    const asistenciasPrevias = registros.filter(r => r.correo === correo);
    const numeroAsistencia = asistenciasPrevias.length + 1;

    // 🔹 Validar máximo de 3 asistencias
    if (numeroAsistencia > 3) {
      return res.status(400).json({ error: "Ya registraste las 3 asistencias." });
    }

    // 🔹 Registrar nueva asistencia
    const nuevoRegistro = {
      id,
      nombre,
      correo,
      club,
      numeroAsistencia,
      asistio: "Sí",
      fecha: new Date().toISOString(),
      ...resto,
    };

    registros.push(nuevoRegistro);

    // 🔹 Codificar y guardar en GitHub
    const contenidoBase64 = Buffer.from(JSON.stringify(registros, null, 2)).toString("base64");

    // Subir el archivo actualizado
    await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Registro de asistencia ${numeroAsistencia} - ${correo}`,
        content: contenidoBase64,
        sha: respuesta.ok ? (await respuesta.json()).sha : undefined,
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
