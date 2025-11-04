export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Método no permitido");

  const { id, titulo, fechaCierre, evaluation } = req.body;

  const archivo = `data/formularios.json`;
  const repo = "proyectoja/asistencia-especialidades";

  try {
    // Obtener archivo actual
    const resp = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    let data = {};
    let sha = null;

    if (resp.ok) {
      const archivoJson = await resp.json();
      const contenido = Buffer.from(archivoJson.content, "base64").toString();
      data = JSON.parse(contenido);
      sha = archivoJson.sha;
    }

    // ✅ Validar si ya existe el ID
    if (data[id]) {
      return res.status(409).json({ error: `El formulario con ID '${id}' ya existe.` });
    }

    // ✅ Agregar nuevo formulario
    data[id] = {
      titulo,
      fechaCierre,
      creado: new Date().toISOString(),
      tieneEvaluacion: !!evaluation
    };

    const nuevoContenido = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    // Guardar formulario en GitHub
    const guardar = await fetch(`https://api.github.com/repos/${repo}/contents/${archivo}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Formulario creado: ${id}`,
        content: nuevoContenido,
        branch: "main",
        ...(sha && { sha }),
      }),
    });

    if (!guardar.ok) {
      const error = await guardar.json();
      return res.status(500).json({ error: error.message || "Error al guardar formulario" });
    }

    // Si hay evaluación, guardarla también
    if (evaluation && evaluation.length > 0) {
      const evaluacionRes = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/guardarEvaluacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, evaluation })
      });

      if (!evaluacionRes.ok) {
        console.error("Error al guardar evaluación, pero el formulario se creó correctamente");
      }
    }

    res.status(200).json({ ok: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}